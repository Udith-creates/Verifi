const hre = require("hardhat");

async function main() {
    console.log("🕵️‍♂️ Diagnosing Ownership Issue...");

    // 1. Get the Deployer Account (Account #0)
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    console.log("🔑 Hardhat Deployer Account:", deployer.address);

    // 2. Define Addresses (from your logs)
    const SBT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const MARKETPLACE_ADDRESS = "0x9A676e781A523b5d0C0e43731313A708CB607508";

    // 3. Connect to Contracts
    const sbt = await hre.ethers.getContractAt("ReputationSBT", SBT_ADDRESS, deployer);

    // 4. Check Actual Owner
    const currentOwner = await sbt.owner();
    console.log("👤 Contract Owner is:       ", currentOwner);

    if (currentOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
        console.log("✅ GOOD NEWS: Marketplace is ALREADY the owner!");
        return;
    }

    if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("⚠️  WARNING: The Deployer is NOT the owner.");
        console.log("    This usually happens if you restarted the chain without redeploying.");
        console.log("    Attempting to proceed anyway...");
    }

    // 5. Force Transfer
    console.log("🚀 Attempting Transfer via Hardhat Account...");
    try {
        const tx = await sbt.transferOwnership(MARKETPLACE_ADDRESS);
        console.log("⏳ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ SUCCESS: Ownership Transferred to Marketplace!");
    } catch (error) {
        console.error("❌ Transfer Failed:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
