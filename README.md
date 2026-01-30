# VeriFi - P2P Zero-Knowledge Lending Marketplace

A decentralized peer-to-peer lending platform that uses **Zero-Knowledge Proofs** to verify creditworthiness without revealing private financial data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.20-brightgreen)
![Next.js](https://img.shields.io/badge/next.js-15.5.9-black)

## 🌟 Features

### Privacy-Preserving Credit Verification
- **Zero-Knowledge Proofs**: Borrowers prove creditworthiness without revealing income, assets, or debt
- **Groth16 Protocol**: Efficient cryptographic proofs using circom and snarkjs
- **Client-Side Generation**: All sensitive data stays on the user's device

### Secure Lending Marketplace
- **Smart Contract Escrow**: ETH locked in contract until proof verification
- **Replay Attack Prevention**: Proofs are bound to specific offer thresholds
- **On-Chain Verification**: Cryptographic proof validation in Solidity

### User-Friendly Interface
- **5 Dedicated Tabs**: Browse Offers, Generate Proof, Accept Loan, Lend, Verify Tool
- **Real-Time Status**: Animated feedback for all operations
- **Proof Download/Upload**: Export and independently verify proofs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Udith-creates/Verifi.git
cd Verifi

# Install dependencies
yarn install

# Compile ZK circuits
node packages/hardhat/scripts/compile_circuits.js
```

### Running Locally

```bash
# Terminal 1: Start local blockchain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy --reset

# Terminal 3: Start frontend
yarn start
```

Access the app at `http://localhost:3001`

## 📖 How It Works

### For Lenders
1. Navigate to **"Lend"** tab
2. Enter loan amount (ETH) and minimum credit score
3. Click **"Create Offer"**
4. ETH is locked in smart contract

### For Borrowers
1. Browse available offers in **"Browse Offers"** tab
2. Note the Offer ID and required minimum score
3. Go to **"Generate Proof"** tab
4. Enter your financial data:
   - Annual Income
   - Total Assets
   - Total Debt
   - Required Threshold (from offer)
5. Click **"Generate & Verify Proof"**
6. Go to **"Accept Loan"** tab
7. Enter Offer ID and submit proof
8. Receive ETH instantly if proof is valid!

### The Math
Your credit score is calculated as:
```
score = (income × 3) + assets - (debt × 2)
```

The ZK proof verifies `score > threshold` **without revealing** the actual values.

## 🔧 Technology Stack

### Smart Contracts
- **Solidity 0.8.20**: LendingMarketplace.sol
- **Groth16 Verifier**: Auto-generated from circom circuit
- **Hardhat**: Development environment

### ZK Circuits
- **circom**: Circuit definition language
- **snarkjs**: Proof generation and verification
- **Powers of Tau**: Trusted setup ceremony

### Frontend
- **Next.js 15**: React framework
- **Wagmi + RainbowKit**: Web3 wallet connection
- **TailwindCSS + DaisyUI**: Styling
- **TypeScript**: Type safety

## 📁 Project Structure

```
Verifi/
├── packages/
│   ├── hardhat/
│   │   ├── circuits/
│   │   │   ├── creditScore.circom       # ZK circuit definition
│   │   │   └── build/                   # Compiled circuit artifacts
│   │   ├── contracts/
│   │   │   ├── LendingMarketplace.sol   # Main lending contract
│   │   │   └── Verifier.sol             # ZK proof verifier
│   │   ├── deploy/
│   │   │   └── 02_deploy_marketplace.ts # Deployment script
│   │   └── scripts/
│   │       └── compile_circuits.js      # Circuit compilation
│   └── nextjs/
│       ├── app/
│       │   ├── api/offers/              # Local DB API
│       │   └── page.tsx                 # Main page
│       ├── components/
│       │   └── LendingMarketplace.tsx   # Main UI component
│       ├── data/
│       │   └── offers.json              # Local offer storage
│       └── public/circuits/             # Circuit artifacts for browser
├── SYSTEM_STATUS.md                     # System documentation
├── WALLET_SETUP.md                      # Wallet connection guide
└── README.md                            # This file
```

## 🔐 Security Features

### Zero-Knowledge Proofs
- **Privacy**: Financial data never leaves the user's device
- **Verifiability**: Cryptographic proof of creditworthiness
- **Non-Interactive**: No back-and-forth communication needed

### Smart Contract Security
- **Threshold Binding**: Proofs are tied to specific offer requirements
- **Replay Prevention**: Each proof is valid for only one offer
- **Reentrancy Protection**: Standard security patterns
- **Access Control**: Only proof holder can accept loan

## 🧪 Testing

### MetaMask Setup
1. Add Hardhat Local network:
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency**: `ETH`

2. Import test account:
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

### Example Test Flow
```javascript
// Lender creates offer
Income: 50000
Assets: 10000
Debt: 5000
Threshold: 100

// Calculated score: (50000 × 3) + 10000 - (5000 × 2) = 150000
// Score > 100 ✅ Proof will be valid
```

## 📊 Circuit Details

### Inputs
- **Private**: `income`, `assets`, `debt`
- **Public**: `threshold`

### Constraints
```circom
signal calculatedScore <== (income * 3) + assets - (debt * 2);
signal isValid <== GreaterThan(252)([calculatedScore, threshold]);
```

### Outputs
- **Public**: `isValid` (1 if valid, 0 otherwise)

## 🛣️ Roadmap

- [ ] Multi-collateral support
- [ ] Interest rate mechanisms
- [ ] Loan repayment tracking
- [ ] Credit history on-chain
- [ ] Subgraph for event indexing
- [ ] Mobile app
- [ ] Mainnet deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

**Built with Zero-Knowledge Proofs for Privacy-Preserving DeFi**
