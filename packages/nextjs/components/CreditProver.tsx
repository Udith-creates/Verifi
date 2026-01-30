"use client";

import { useState } from "react";
// @ts-ignore
import * as snarkjs from "snarkjs";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import DecryptedText from "./DecryptedText";

export const CreditProver = () => {
    const [income, setIncome] = useState("");
    const [assets, setAssets] = useState("");
    const [debt, setDebt] = useState("");
    const [proofData, setProofData] = useState<any>(null);
    const [status, setStatus] = useState("");

    const { writeContractAsync: applyForLoan } = useScaffoldWriteContract("LendingProtocol");

    const generateProof = async () => {
        try {
            setStatus("COMPUTING ZK PROOF...");

            // Minimum required threshold for approval
            const threshold = 100;

            const input = {
                income: parseInt(income),
                assets: parseInt(assets),
                debt: parseInt(debt),
                threshold: threshold,
            };

            // Pre-check for better UX (Client-side only)
            // We calculate this locally to give feedback. The ZK proof ensures we can't cheat this.
            const calculatedScore = (input.income * 3) + input.assets - (input.debt * 2);
            if (calculatedScore <= threshold) {
                setStatus(`ERROR: Score ${calculatedScore} is too low (Req > ${threshold})`);
                // We throw so it goes to catch block or just return
                return;
            }

            // Paths to files in public/circuits/
            const wasmFile = "/circuits/creditScore.wasm";
            const zkeyFile = "/circuits/circuit_final.zkey";

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFile, zkeyFile);

            console.log("Proof generated", proof);
            console.log("Public Signals", publicSignals);

            // Format for Solidity (Groth16 Verifier)
            // snarkjs returns string numbers, Solidity requires BigInt for uint256
            const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
            const pB = [
                [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
                [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
            ];
            const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];

            // Convert public signals to BigInt
            const pubInput = publicSignals.map((s: string) => BigInt(s));

            setProofData({ pA, pB, pC, pubInput, fullProof: proof });
            setStatus("PROOF GENERATED");

        } catch (e) {
            console.error(e);
            setStatus("ERROR GENERATING PROOF");
        }
    };

    const submitProof = async () => {
        if (!proofData) return;
        try {
            setStatus("SUBMITTING TO CHAIN...");
            await applyForLoan({
                functionName: "applyForLoan",
                args: [
                    proofData.pA,
                    proofData.pB,
                    proofData.pC,
                    proofData.pubInput
                ],
            });
            setStatus("LOAN APPROVED");
        } catch (e) {
            console.error(e);
            setStatus("TRANSACTION FAILED");
        }
    };

    return (
        <div className="card w-full max-w-2xl bg-base-100 shadow-xl m-4">
            <div className="card-body">
                <h2 className="card-title text-2xl font-bold mb-4">VeriFi: Zero-Knowledge Prover</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Annual Income</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Income"
                            className="input input-bordered"
                            value={income}
                            onChange={e => setIncome(e.target.value)}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Total Assets</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Assets"
                            className="input input-bordered"
                            value={assets}
                            onChange={e => setAssets(e.target.value)}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Total Debt</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Debt"
                            className="input input-bordered"
                            value={debt}
                            onChange={e => setDebt(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card-actions justify-end mt-6 space-x-2">
                    <button
                        className="btn btn-primary"
                        onClick={generateProof}
                        disabled={!income || !assets || !debt}
                    >
                        Generate ZK Proof
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={submitProof}
                        disabled={!proofData}
                    >
                        Submit to Chain
                    </button>
                </div>

                {status && (
                    <div className="mt-4 p-4 bg-base-200 rounded-lg text-center font-mono text-lg">
                        <DecryptedText
                            text={status}
                            speed={50}
                            animateOn="view"
                            revealDirection="center"
                        />
                    </div>
                )}

                {proofData && (
                    <div className="mt-4 flex flex-col gap-2">
                        <a
                            className="btn btn-outline btn-sm w-full"
                            href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(proofData.fullProof, null, 2))}`}
                            download="proof.json"
                        >
                            Download Proof JSON
                        </a>

                        <div className="collapse collapse-arrow bg-base-200">
                            <input type="checkbox" />
                            <div className="collapse-title text-xl font-medium">
                                Show Proof Data (Mathematical Evidence)
                            </div>
                            <div className="collapse-content">
                                <pre className="text-xs overflow-x-auto bg-black text-green-400 p-4 rounded">
                                    {JSON.stringify(
                                        {
                                            curved: "bn128",
                                            proof: proofData.fullProof,
                                            publicSignals: proofData.pubInput.map((x: any) => x.toString())
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
