"use client";

import { useState, useEffect } from "react";
// @ts-ignore
import * as snarkjs from "snarkjs";
import { useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import DecryptedText from "./DecryptedText";
import { parseEther, formatEther } from "viem";

export const LendingMarketplace = () => {
    // --- Lender State ---
    const [lenderAmount, setLenderAmount] = useState("");
    const [lenderMinScore, setLenderMinScore] = useState("");

    // --- Proof Generator State ---
    const [income, setIncome] = useState("");
    const [assets, setAssets] = useState("");
    const [debt, setDebt] = useState("");
    const [threshold, setThreshold] = useState("");
    const [proofData, setProofData] = useState<any>(null);
    const [status, setStatus] = useState("");

    // --- Accept Loan State ---
    const [selectedOfferId, setSelectedOfferId] = useState("");

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
    const { writeContractAsync: acceptOffer } = useScaffoldWriteContract("LendingMarketplace");

    const { data: events } = useScaffoldEventHistory({
        contractName: "LendingMarketplace",
        eventName: "OfferCreated",
        fromBlock: 0n,
    });

    // --- UI/Local State ---
    const [localOffers, setLocalOffers] = useState<any[]>([]);

    const fetchLocalOffers = async () => {
        try {
            const res = await fetch("/api/offers");
            const data = await res.json();
            setLocalOffers(data);
        } catch (e) {
            console.error("Failed to load offers", e);
        }
    };

    useEffect(() => {
        fetchLocalOffers();
    }, []);

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

            await fetch("/api/offers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: lenderAmount,
                    minScore: lenderMinScore,
                    active: true,
                    description: "Local Metadata"
                })
            });

            setStatus("Offer Created Successfully!");
            setLenderAmount("");
            setLenderMinScore("");
            fetchLocalOffers();
        } catch (e) {
            console.error(e);
            setStatus("Error creating offer: " + (e as Error).message);
        }
    };

    const generateProof = async () => {
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
            setStatus("✅ Proof Generated & Verified! Use 'Accept Loan' tab to submit.");

        } catch (e) {
            console.error(e);
            setStatus("Error processing proof: " + (e as Error).message);
        }
    };

    const handleAcceptLoan = async () => {
        if (!proofData || !selectedOfferId) {
            setStatus("Error: Generate a proof first and select an offer ID.");
            return;
        }
        try {
            setStatus("Submitting to Blockchain...");
            await acceptOffer({
                functionName: "acceptOffer",
                args: [
                    BigInt(selectedOfferId),
                    proofData.pA,
                    proofData.pB,
                    proofData.pC,
                    proofData.pubInput
                ]
            });
            setStatus("✅ Success! Loan received.");
            setProofData(null);
            setSelectedOfferId("");
        } catch (e) {
            console.error(e);
            setStatus("Transaction failed: " + (e as Error).message);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <h1 className="text-4xl font-bold text-center mb-8">P2P ZK Lending Market</h1>

            {/* Status Bar */}
            {status && (
                <div className="mb-4 p-4 bg-base-200 rounded-lg text-center font-mono">
                    <DecryptedText text={status} speed={50} animateOn="view" revealDirection="center" />
                </div>
            )}

            <div role="tablist" className="tabs tabs-boxed mb-8">
                {/* BORROW TAB - View Offers */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Browse Offers" defaultChecked />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Available Loan Offers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events && events.length > 0 ? (
                            events.map((e) => (
                                <div key={e.args.id?.toString()} className="card bg-base-200 shadow-md">
                                    <div className="card-body">
                                        <h3 className="card-title">Offer #{e.args.id?.toString()}</h3>
                                        <p>Amount: {e.args.amount ? formatEther(e.args.amount) : "0"} ETH</p>
                                        <p className="text-error font-bold">Min Score: {e.args.minScore?.toString()}</p>
                                        <div className="badge badge-success">Active</div>
                                    </div>
                                </div>
                            ))
                        ) : localOffers.length > 0 ? (
                            localOffers.map((offer, index) => (
                                <div key={index} className="card bg-base-200 shadow-md">
                                    <div className="card-body">
                                        <h3 className="card-title">{offer.description || `Offer #${index}`}</h3>
                                        <p>Amount: {offer.amount} ETH</p>
                                        <p className="text-error font-bold">Min Score: {offer.minScore}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-8">
                                <p className="text-lg opacity-70">No offers available yet.</p>
                                <p className="text-sm opacity-50 mt-2">Create an offer in the "Lend" tab!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* GENERATE PROOF TAB */}
                <input type="radio" name="my_tabs" role="tab" className="tab" aria-label="Generate Proof" />
                <div role="tabpanel" className="tab-content p-6 bg-base-100 border-base-300 rounded-box">
                    <h2 className="text-2xl font-bold mb-4">Generate ZK Proof</h2>
                    <p className="mb-4 opacity-70">Enter your financial data to generate a privacy-preserving proof.</p>

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
                            <label className="label">Required Threshold (from offer)</label>
                            <input className="input input-bordered" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="100" />
                        </div>

                        <button className="btn btn-primary mt-4" onClick={generateProof}>
                            Generate & Verify Proof
                        </button>

                        {proofData && (
                            <div className="alert alert-success">
                                <span>✅ Proof Ready! Go to "Accept Loan" tab.</span>
                            </div>
                        )}

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
                    <h2 className="text-2xl font-bold mb-4">Accept Loan with Proof</h2>
                    <p className="mb-4 opacity-70">Submit your proof to accept a loan offer.</p>

                    <div className="flex flex-col gap-4 max-w-md">
                        <div className="form-control">
                            <label className="label">Offer ID</label>
                            <input className="input input-bordered" type="number" value={selectedOfferId} onChange={e => setSelectedOfferId(e.target.value)} placeholder="0" />
                        </div>

                        {!proofData && (
                            <div className="alert alert-warning">
                                <span>⚠️ Generate a proof first in the "Generate Proof" tab</span>
                            </div>
                        )}

                        {proofData && (
                            <div className="alert alert-info">
                                <span>✅ Proof loaded and ready to submit</span>
                            </div>
                        )}

                        <button
                            className="btn btn-success mt-4"
                            onClick={handleAcceptLoan}
                            disabled={!proofData || !selectedOfferId}
                        >
                            Accept Loan (On-Chain)
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
                </div>
            </div>
        </div>
    );
};
