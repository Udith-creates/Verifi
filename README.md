# VeriFi: Zero-Knowledge Reputation Lending Protocol

VeriFi is a decentralized lending platform that uses **Zero-Knowledge Proofs (ZKPs)** to verify a borrower's creditworthiness without revealing their actual financial data.

Built with 🏗 [Scaffold-ETH 2](https://scaffoldeth.io), Circom, and SnarkJS.

## 🌟 Key Features

- **Private Solvency Check:** Users generate a local ZK proof that their `(Income * 3 + Assets - Debt * 2)` exceeds a lender's threshold.
- **On-Chain Verification:** The `Groth16Verifier` smart contract verifies the proof on Ethereum (or L2s).
- **Reputation SBTs:** Borrowers earn Soulbound Tokens (SBTs) upon repaying loans, building on-chain reputation.
- **IPFS Integration:** Reputation badges have metadata stored on IPFS.

## 🔐 How ZK Verification Works

VeriFi uses `circom` circuits to prove computational integrity.

1.  **Off-Chain (Client Side):**
    - The user inputs their financial data: `Income`, `Assets`, `Debt`.
    - A randomly generated `Threshold` is provided by the lender (or system).
    - The `creditScore.circom` circuit computes: `Score = (Income * 3) + Assets - (Debt * 2)`.
    - It checks if `Score > Threshold`.
    - **Crucially:** The proof contains NO information about the actual income or debt values. It only reveals `true/false` (Solvency Valid) and the `Threshold` used.

2.  **On-Chain (Smart Contract):**
    - The user submits the generated `Proof` (pA, pB, pC) and `Public Signals` (Threshold) to the `LendingMarketplace`.
    - The contract calls `Verifier.verifyProof(...)`.
    - If valid, the contract marks the user as `Solvent` for a temporary period (e.g., 90 days), allowing them to accept loans.

## 🚀 Quick Start

1.  **Install Dependencies:**
    ```bash
    yarn install
    ```

2.  **Start Local Chain:**
    ```bash
    yarn chain
    ```

3.  **Compile Circuits & Deploy Contracts:**
    ```bash
    # This compiles circuits, generates verifier, and deploys
    yarn deploy --reset
    ```

4.  **Start Frontend:**
    ```bash
    yarn start
    ```

5.  **Visit App:**
    `http://localhost:3000`

## 🛠 Tech Stack

### Core Frameworks
- **Scaffold-ETH 2:** Development stack for rapid Ethereum prototyping.
- **Hardhat:** Ethereum development environment for compiling and deploying smart contracts.
- **Next.js:** React framework for the frontend interface.

### Zero-Knowledge Proofs
- **Circom:** DSL for writing arithmetic circuits to define the credit score logic.
- **SnarkJS:** Library for generating ZK proofs (witness calculation) and verifying them.
- **Groth16:** The proving system used for efficient on-chain verification.

### Blockchain & Smart Contracts
- **Solidity:** Programming language for the contracts (`LendingMarketplace.sol`, `ReputationSBT.sol`).
- **OpenZeppelin:** Standard libraries for logic like `ERC721` (for SBTs) and `Ownable`.
- **IPFS:** Decentralized storage for Reputation Badge metadata and images.

### Frontend Libraries
- **RainbowKit:** Wallet connection interface.
- **Wagmi / Viem:** React hooks and utilities for interacting with Ethereum.
- **TailwindCSS:** Utility-first CSS framework for styling.
- **DaisyUI:** Component library for UI elements (modals, cards, buttons).

## 🤝 Contributing

Contributions are welcome! Please fork the repo and submit a PR.

---
*Built by Udith*
