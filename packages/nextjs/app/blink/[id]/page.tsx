"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
// @ts-ignore
import * as snarkjs from "snarkjs";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";

export default function BlinkPage() {
    const params = useParams();
    const offerId = params.id as string;
    const { address, isConnected } = useAccount();

    // Form state
    const [income, setIncome] = useState("");
    const [assets, setAssets] = useState("");
    const [debt, setDebt] = useState("");
    const [status, setStatus] = useState("");
    const [proofData, setProofData] = useState<any>(null);
    const [isEligible, setIsEligible] = useState(false);

    // Fetch offer data
    const { data: offerData } = useScaffoldReadContract({
        contractName: "LendingMarketplace",
        functionName: "offers",
        args: [BigInt(offerId)],
    });

    const { writeContractAsync: acceptOffer } = useScaffoldWriteContract("LendingMarketplace");

    const handleCheckEligibility = async () => {
        if (!income || !assets || !debt || !offerData) {
            setStatus("Please fill in all fields");
            return;
        }

        try {
            setStatus("Generating ZK Proof...");

            const threshold = Number(offerData[3]); // minScore is at index 3

            const input = {
                income: parseInt(income),
                assets: parseInt(assets),
                debt: parseInt(debt),
                threshold: threshold,
            };

            // Client-side pre-check
            const calculatedScore = input.income * 3 + input.assets - input.debt * 2;
            if (calculatedScore <= threshold) {
                setStatus(`❌ Not Eligible. Your score (${calculatedScore}) must be > ${threshold}`);
                setIsEligible(false);
                return;
            }

            // Generate proof
            const wasmFile = "/circuits/creditScore.wasm";
            const zkeyFile = "/circuits/circuit_final.zkey";
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFile, zkeyFile);

            // Verify proof client-side
            setStatus("Verifying proof...");
            const vKey = await fetch("/circuits/verification_key.json").then(res => res.json());
            const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

            if (!isValid) {
                setStatus("❌ Proof verification failed");
                setIsEligible(false);
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

            setProofData({ pA, pB, pC, pubInput });
            setIsEligible(true);
            setStatus("✅ Eligible! You can claim this loan.");
        } catch (e) {
            console.error(e);
            setStatus("Error: " + (e as Error).message);
            setIsEligible(false);
        }
    };

    const handleClaimLoan = async () => {
        if (!proofData) return;

        try {
            setStatus("Submitting to blockchain...");
            await acceptOffer({
                functionName: "acceptOffer",
                args: [BigInt(offerId), proofData.pA, proofData.pB, proofData.pC, proofData.pubInput],
            });
            setStatus("🎉 Loan claimed successfully!");
            setProofData(null);
            setIsEligible(false);
        } catch (e) {
            console.error(e);
            setStatus("Transaction failed: " + (e as Error).message);
        }
    };

    if (!offerData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
                <div className="text-white text-xl">Loading offer...</div>
            </div>
        );
    }

    const amount = offerData[2]; // amount is at index 2
    const minScore = offerData[3]; // minScore is at index 3
    const active = offerData[4]; // active is at index 4

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
            <div className="max-w-md w-full">
                {/* Loan Card */}
                <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl shadow-2xl p-8 border-4 border-purple-300">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">
                            VeriFi Loan Offer
                        </div>
                        <div className="text-6xl font-bold text-white mb-2">{formatEther(amount)} ETH</div>
                        <div className="text-white/90 text-lg">Instant ZK Loan</div>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-white/30 my-6"></div>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-white/80 font-medium">Offer ID:</span>
                            <span className="text-white font-bold text-xl">#{offerId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/80 font-medium">Min Credit Score:</span>
                            <span className="text-white font-bold text-xl">{minScore.toString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/80 font-medium">Status:</span>
                            <span
                                className={`font-bold text-lg ${active ? "text-green-300" : "text-red-300"}`}
                            >
                                {active ? "🟢 Active" : "🔴 Inactive"}
                            </span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-white/30 my-6"></div>

                    {/* Connection & Form */}
                    {!isConnected ? (
                        <div className="text-center">
                            <p className="text-white/90 mb-4">Connect your wallet to claim this loan</p>
                            <div className="flex justify-center">
                                <ConnectButton />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-white/90 text-sm text-center mb-4">
                                Enter your financial data to check eligibility
                            </div>

                            <input
                                type="number"
                                placeholder="Annual Income"
                                value={income}
                                onChange={e => setIncome(e.target.value)}
                                className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
                            />
                            <input
                                type="number"
                                placeholder="Total Assets"
                                value={assets}
                                onChange={e => setAssets(e.target.value)}
                                className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
                            />
                            <input
                                type="number"
                                placeholder="Total Debt"
                                value={debt}
                                onChange={e => setDebt(e.target.value)}
                                className="input input-bordered w-full bg-white/10 text-white placeholder-white/50 border-white/30"
                            />

                            {!isEligible ? (
                                <button
                                    onClick={handleCheckEligibility}
                                    className="btn btn-success w-full text-lg font-bold"
                                    disabled={!active}
                                >
                                    🔐 Check Eligibility
                                </button>
                            ) : (
                                <button onClick={handleClaimLoan} className="btn btn-warning w-full text-lg font-bold">
                                    💰 Claim Loan
                                </button>
                            )}

                            {status && (
                                <div
                                    className={`alert ${status.includes("✅") || status.includes("🎉")
                                        ? "alert-success"
                                        : status.includes("❌")
                                            ? "alert-error"
                                            : "alert-info"
                                        } shadow-lg`}
                                >
                                    <span className="text-sm">{status}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-white/60 text-sm">
                    Powered by Zero-Knowledge Proofs
                </div>
            </div>
        </div>
    );
}
