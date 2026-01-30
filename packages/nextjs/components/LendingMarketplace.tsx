"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
// @ts-ignore
import * as snarkjs from "snarkjs";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldWriteContract, useScaffoldReadContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import DecryptedText from "./DecryptedText";
import { parseEther, formatEther } from "viem";

export const LendingMarketplace = () => {
    const { address } = useAccount();

    // --- Lender State ---
    const [lenderAmount, setLenderAmount] = useState("");
    const [lenderMinScore, setLenderMinScore] = useState("");

    // --- Solvency/Proof Generator State ---
    const [income, setIncome] = useState("");
    const [assets, setAssets] = useState("");
    const [debt, setDebt] = useState("");
    const [threshold, setThreshold] = useState("");
    const [proofData, setProofData] = useState<any>(null);
    const [status, setStatus] = useState("");

    // --- Add to Wallet Logic ---
    const { data: sbtContract } = useScaffoldContract({ contractName: "ReputationSBT" });

    const addToWallet = async () => {
        const ethereum = (window as any).ethereum;
        if (!ethereum || !sbtContract) return;

        try {
            await ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC721",
                    options: {
                        address: sbtContract.address,
                        tokenId: "1", // We use ID 1 as a sample, or the user's actual token ID if we fetched it
                        symbol: "VERIFI",
                        image: "https://ipfs.io/ipfs/bafkreibkvjcfseiep6bp2y53zua2bah4qymwg4vznsxy4hwke5pfuavldy",
                    },
                },
            });
            toast.success("Token added to wallet!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add token.");
        }
    };

    // --- Loan State ---
    const [selectedOfferId, setSelectedOfferId] = useState("");
    const [repayOfferId, setRepayOfferId] = useState("");

    // --- SBT Celebration ---
    const [showSBTModal, setShowSBTModal] = useState(false);

    // --- Verifier Tool State ---
    const [verifyStatus, setVerifyStatus] = useState("");
    const [uploadedProof, setUploadedProof] = useState<any>(null);

    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                setUploadedProof(json);
                setVerifyStatus("File loaded. Ready to verify.");
            } catch (err) {
                setVerifyStatus("Error parsing JSON file.");
            }
        };
        reader.readAsText(file);
    };

    const handleVerifyUploadedProof = async () => {
        if (!uploadedProof || !uploadedProof.proof || !uploadedProof.publicSignals) {
            setVerifyStatus("Invalid file format. Needs { proof, publicSignals }");
            return;
        }
        try {
            setVerifyStatus("Checking cryptographic proof...");
            const vKey = await fetch("/circuits/verification_key.json").then((res) => res.json());
            const isValid = await snarkjs.groth16.verify(vKey, uploadedProof.publicSignals, uploadedProof.proof);

            if (isValid) {
                const threshold = uploadedProof.publicSignals[1];
                setVerifyStatus(`✅ VALID PROOF! Verified against Threshold: ${threshold}`);
            } else {
                setVerifyStatus("❌ INVALID PROOF.");
            }
        } catch (e) {
            console.error(e);
            setVerifyStatus("Error during verification: " + (e as Error).message);
        }
    };

    // --- Contracts ---
    const { writeContractAsync: createOffer } = useScaffoldWriteContract("LendingMarketplace");
    const { writeContractAsync: proveSolvency } = useScaffoldWriteContract("LendingMarketplace");
    const { writeContractAsync: acceptOffer } = useScaffoldWriteContract("LendingMarketplace");
    const { writeContractAsync: repayLoan } = useScaffoldWriteContract("LendingMarketplace");
    const { writeContractAsync: transferOwnership } = useScaffoldWriteContract("ReputationSBT");

    // Read solvency status
    const { data: solvencyData } = useScaffoldReadContract({
        contractName: "LendingMarketplace",
        functionName: "solvency",
        args: [address],
    });

    // Read solvency time remaining
    const { data: timeRemaining } = useScaffoldReadContract({
        contractName: "LendingMarketplace",
        functionName: "getSolvencyTimeRemaining",
        args: [address],
    });

    // Read SBT reputation
    const { data: reputation } = useScaffoldReadContract({
        contractName: "ReputationSBT",
        functionName: "getReputation",
        args: [address],
    });

    const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
        contractName: "LendingMarketplace",
        eventName: "OfferCreated",
        fromBlock: 0n,
        watch: true,
    });

    const handleCreateOffer = async () => {
        if (!lenderAmount || !lenderMinScore) {
            setStatus("Error: Please fill in all fields (Amount & Min Score).");
            return;
        }

        try {
            setStatus("Creating Offer on Chain...");

            await createOffer({
                functionName: "createOffer",
                args: [BigInt(lenderMinScore)],
                value: parseEther(lenderAmount),
            });

            setStatus("✅ Offer Created Successfully! Refresh to see it.");
            setLenderAmount("");
            setLenderMinScore("");
            toast.success("Offer created on-chain!");
        } catch (e: any) {
            console.error(e);
            setStatus("Error creating offer: " + (e.message || "Unknown error"));
        }
    };

    const generateAndProveSolvency = async () => {
        if (!income || !assets || !debt || !threshold) {
            setStatus("Error: Please fill in all fields.");
            return;
        }

        try {
            setStatus("COMPUTING ZK PROOF...");

            const input = {
                income: parseInt(income),
                assets: parseInt(assets),
                debt: parseInt(debt),
                threshold: parseInt(threshold),
            };

            // Client-side pre-check
            const calculatedScore = (input.income * 3) + input.assets - (input.debt * 2);
            if (calculatedScore <= input.threshold) {
                setStatus(`ERROR: Your score ${calculatedScore} is not > ${input.threshold}`);
                return;
            }

            // 1. Generate Proof
            const wasmFile = "/circuits/creditScore.wasm";
            const zkeyFile = "/circuits/circuit_final.zkey";
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFile, zkeyFile);

            // 2. Client-side Verify
            setStatus("Verifying Proof Locally...");
            const vKey = await fetch("/circuits/verification_key.json").then((res) => res.json());
            const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

            if (!isValid) {
                setStatus("Error: Invalid Proof Generated.");
                return;
            }

            // Format for Solidity
            const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
            const pB = [
                [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
                [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
            ];
            const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];
            const pubInput = publicSignals.map((s: string) => BigInt(s));

            setProofData({ pA, pB, pC, pubInput, fullProof: proof, publicSignals });

            // 3. Submit to contract
            setStatus("Submitting Solvency Proof to Blockchain...");
            await proveSolvency({
                functionName: "proveSolvency",
                args: [
                    pA as [bigint, bigint],
                    pB as [[bigint, bigint], [bigint, bigint]],
                    pC as [bigint, bigint],
                    pubInput as [bigint, bigint]
                ]
            });

            setStatus("✅ Solvency Verified! You can now accept loans.");
            toast.success("Solvency Verified on-chain!");
        } catch (e: any) {
            console.error(e);
            setStatus("Error: " + (e.message || "Unknown error"));
        }
    };

    const handleAcceptLoan = async () => {
        if (!selectedOfferId) {
            setStatus("Error: Enter an Offer ID.");
            return;
        }
        try {
            setStatus("Accepting Loan...");
            await acceptOffer({
                functionName: "acceptOffer",
                args: [BigInt(selectedOfferId)]
            });
            setStatus("✅ Loan Accepted! ETH received.");
            toast.success("Loan received! Don't forget to repay.");
        } catch (e) {
            console.error(e);
            setStatus("Transaction failed: " + (e as Error).message);
        }
    };

    const handleRepayLoan = async () => {
        if (!repayOfferId) {
            setStatus("Error: Enter the Offer ID to repay.");
            return;
        }

        // Get offer amount from events
        const offer = events?.find(e => e.args.id?.toString() === repayOfferId);
        if (!offer) {
            setStatus("Error: Offer not found.");
            return;
        }

        try {
            setStatus("Repaying Loan...");
            await repayLoan({
                functionName: "repayLoan",
                args: [BigInt(repayOfferId)],
                value: offer.args.amount || 0n
            });
            setStatus("✅ Loan Repaid! SBT Minted!");
            setShowSBTModal(true);
            toast.success("🎉 Reputation increased!");
        } catch (e: any) {
            console.error(e);
            if (e.message.includes("Ownable: caller is not the owner")) {
                setStatus("⚠️ SETUP ISSUE: Ownership not transferred. Click 'Fix Ownership' below.");
            } else {
                setStatus("Repayment failed: " + (e.message || "Unknown error"));
            }
        }
    };

    const handleFixOwnership = async () => {
        try {
            const marketplaceAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
            await transferOwnership({
                functionName: "transferOwnership",
                args: [marketplaceAddress],
            });
            toast.success("✅ Ownership Transferred! Try repaying now.");
            setStatus("Ownership fixed! You can now Repay Loan.");
        } catch (e: any) {
            console.error(e);
            setStatus("Fix failed: " + (e.message || "Unknown error"));
        }
    };

    // Calculate solvency status
    const isSolvencyValid = solvencyData && solvencyData[1] > BigInt(Math.floor(Date.now() / 1000));
    const solvencyThreshold = solvencyData ? Number(solvencyData[0]) : 0;
    const timeRemainingSeconds = timeRemaining ? Number(timeRemaining) : 0;
    const minutesRemaining = Math.floor(timeRemainingSeconds / 60);
    const secondsRemaining = timeRemainingSeconds % 60;

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <h1 className="text-4xl font-bold text-center mb-4">P2P ZK Lending Market</h1>

            {/* Solvency Dashboard */}
            {address && (
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Your Status</h2>
                            {isSolvencyValid ? (
                                <div className="space-y-1">
                                    <p className="text-xl">✅ Solvency Verified</p>
                                    <p className="text-sm opacity-90">Threshold: {solvencyThreshold}</p>
                                    <p className="text-sm opacity-90">
                                        Expires in: {minutesRemaining}m {secondsRemaining}s
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xl">❌ Not Verified - Verify solvency to borrow</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-90">Reputation Score</p>
                            <p className="text-4xl font-bold">{reputation ? Number(reputation) : 0}</p>
                            <p className="text-xs opacity-75">Loans Repaid</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Bar */}
            {status && (
                <div className="mb-4 p-4 bg-base-200 rounded-lg text-center font-mono">
                    <DecryptedText text={status} speed={50} animateOn="view" revealDirection="center" />
                </div>
            )}

            <div role="tablist" className="tabs tabs-boxed mb-8">
                {/* BROWSE OFFERS TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Browse Offers" defaultChecked />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Available Loan Offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoadingEvents ? (
                            <div className="col-span-3 text-center py-12">
                                <span className="loading loading-spinner loading-lg"></span>
                                <p className="mt-2">Loading offers from blockchain...</p>
                            </div>
                        ) : events && events.length > 0 ? (
                            events.map((e) => (
                                <div key={e.args.id?.toString()} className="card bg-base-200 shadow-md">
                                    <div className="card-body">
                                        <h3 className="card-title">Offer #{e.args.id?.toString()}</h3>
                                        <p>Amount: {e.args.amount ? formatEther(e.args.amount) : "0"} ETH</p>
                                        <p className="text-error font-bold">Min Score: {e.args.minScore?.toString()}</p>
                                        <div className="badge badge-success">Active</div>
                                        <div className="card-actions justify-end mt-4">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => {
                                                    const blinkUrl = `${window.location.origin}/blink/${e.args.id?.toString()}`;
                                                    navigator.clipboard.writeText(blinkUrl);
                                                    toast.success("🔗 Blink Link Copied!");
                                                }}
                                            >
                                                🔗 Share Blink
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-12">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-xl font-bold mb-2">No Offers Available</p>
                                <p className="text-sm opacity-70 mb-4">Create the first offer in the "Lend" tab!</p>
                                <p className="text-xs opacity-50">Offers are loaded from blockchain events</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* VERIFY SOLVENCY TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Verify Solvency" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Verify Solvency (Check-In)</h2>
                    <p className="mb-4 opacity-70">Generate a ZK proof to verify your creditworthiness. Valid for 5 minutes.</p>

                    <div className="flex flex-col gap-4 max-w-md">
                        <div className="form-control">
                            <label className="label">Annual Income</label>
                            <input className="input input-bordered" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="50000" />
                        </div>
                        <div className="form-control">
                            <label className="label">Total Assets</label>
                            <input className="input input-bordered" type="number" value={assets} onChange={e => setAssets(e.target.value)} placeholder="10000" />
                        </div>
                        <div className="form-control">
                            <label className="label">Total Debt</label>
                            <input className="input input-bordered" type="number" value={debt} onChange={e => setDebt(e.target.value)} placeholder="5000" />
                        </div>
                        <div className="form-control">
                            <label className="label">Threshold (Your Target Score)</label>
                            <input className="input input-bordered" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="100" />
                        </div>

                        <button className="btn btn-primary mt-4" onClick={generateAndProveSolvency}>
                            🔐 Verify Solvency
                        </button>

                        {proofData && (
                            <a
                                className="btn btn-outline btn-sm"
                                href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
                                    proof: proofData.fullProof,
                                    publicSignals: proofData.publicSignals
                                }, null, 2))}`}
                                download="proof.json"
                            >
                                Download Proof JSON
                            </a>
                        )}
                    </div>
                </div>

                {/* ACCEPT LOAN TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Accept Loan" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Accept Loan</h2>
                    <p className="mb-4 opacity-70">Use your verified solvency to accept a loan offer.</p>

                    <div className="flex flex-col gap-4 max-w-md">
                        {!isSolvencyValid && (
                            <div className="alert alert-warning">
                                <span>⚠️ Verify solvency first in the "Verify Solvency" tab</span>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label">Offer ID</label>
                            <input className="input input-bordered" type="number" value={selectedOfferId} onChange={e => setSelectedOfferId(e.target.value)} placeholder="0" />
                        </div>

                        <button
                            className="btn btn-success mt-4"
                            onClick={handleAcceptLoan}
                            disabled={!isSolvencyValid || !selectedOfferId}
                        >
                            💰 Accept Loan
                        </button>
                    </div>
                </div>

                {/* REPAY LOAN TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Repay Loan" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Repay Loan</h2>
                    <p className="mb-4 opacity-70">Repay your loan and earn reputation!</p>

                    <div className="flex flex-col gap-4 max-w-md">
                        <div className="form-control">
                            <label className="label">Offer ID to Repay</label>
                            <input className="input input-bordered" type="number" value={repayOfferId} onChange={e => setRepayOfferId(e.target.value)} placeholder="0" />
                        </div>

                        <button
                            className="btn btn-accent mt-4"
                            onClick={handleRepayLoan}
                            disabled={!repayOfferId}
                        >
                            💸 Repay Loan
                        </button>
                    </div>
                </div>

                {/* LEND TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Lend" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Create Lending Offer</h2>
                    <div className="flex flex-col gap-4 max-w-md">
                        <div className="form-control">
                            <label className="label">Amount (ETH)</label>
                            <input className="input input-bordered" value={lenderAmount} onChange={e => setLenderAmount(e.target.value)} placeholder="1.0" />
                        </div>
                        <div className="form-control">
                            <label className="label">Min Credit Score</label>
                            <input className="input input-bordered" value={lenderMinScore} onChange={e => setLenderMinScore(e.target.value)} placeholder="100" />
                        </div>
                        <button className="btn btn-accent mt-4" onClick={handleCreateOffer}>Create Offer</button>
                    </div>
                </div>

                {/* VERIFY TOOL TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Verify Tool" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Independent Proof Verifier</h2>
                    <p className="mb-4">Upload a <code>proof.json</code> file to verify its authenticity.</p>

                    <div className="flex flex-col gap-4 max-w-md">
                        <input type="file" className="file-input file-input-bordered w-full" accept=".json" onChange={handleFileUpload} />

                        {verifyStatus && (
                            <div className="alert alert-info shadow-sm">
                                <span>{verifyStatus}</span>
                            </div>
                        )}

                        <button
                            className="btn btn-secondary"
                            onClick={handleVerifyUploadedProof}
                            disabled={!uploadedProof}
                        >
                            Verify ZK Proof
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-base-300">
                        <h3 className="font-bold text-warning mb-2">⚠️ Admin Zone (Use if Repay Fails)</h3>
                        <p className="text-sm opacity-70 mb-2">
                            If "Repay Loan" fails with "caller is not owner", click this button once.
                        </p>
                        <button className="btn btn-warning btn-sm" onClick={handleFixOwnership}>
                            🛠️ Fix Ownership / Setup
                        </button>
                    </div>
                </div>
            </div>

            {/* SBT Celebration Modal */}
            {showSBTModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-3xl text-center mb-4">🎉 Reputation Increased!</h3>
                        <div className="flex justify-center mb-4">
                            <img
                                src="/sbt_badge.jpg"
                                alt="VeriFi Reputation Badge"
                                className="w-64 h-64 object-cover rounded-lg shadow-2xl"
                            />
                        </div>
                        <p className="text-center text-lg mb-2">You've earned a VeriFi Solvency Badge!</p>
                        <p className="text-center opacity-70">Your reputation score: <span className="font-bold text-2xl">{reputation ? Number(reputation) : 0}</span></p>
                        <div className="flex gap-2">
                            <button className="btn btn-primary flex-1" onClick={() => setShowSBTModal(false)}>
                                Awesome!
                            </button>
                            <button className="btn btn-outline btn-secondary" onClick={addToWallet}>
                                🦊 Add to Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
