const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Hardhat Network Connection...\n");

    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("✅ Network Connected!");
        console.log("   Chain ID:", network.chainId.toString());
        console.log("   Name:", network.name);

        // Get block number
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log("\n📦 Current Block:", blockNumber);

        // Get accounts
        const accounts = await ethers.provider.listAccounts();
        console.log("\n👛 Available Accounts:", accounts.length);

        if (accounts.length > 0) {
            console.log("\n💰 Account Balances:");
            for (let i = 0; i < Math.min(3, accounts.length); i++) {
                const balance = await ethers.provider.getBalance(accounts[i]);
                console.log(`   Account ${i}: ${accounts[i]}`);
                console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
            }
        }

        // Check deployed contracts
        const deployments = await hre.deployments.all();
        console.log("\n📜 Deployed Contracts:");
        for (const [name, deployment] of Object.entries(deployments)) {
            console.log(`   ${name}: ${deployment.address}`);
        }

        console.log("\n✅ Everything looks good!");
        console.log("\n🦊 MetaMask Setup:");
        console.log("   Network Name: Hardhat Local");
        console.log("   RPC URL: http://127.0.0.1:8545");
        console.log("   Chain ID: 31337");
        console.log("   Currency: ETH");
        console.log("\n   Import this private key:");
        console.log("   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n💡 Make sure 'yarn chain' is running!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
