const hre = require("hardhat");

async function main() {
    console.log("🛠️ Starting Ownership Fix...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Using Account:", deployer.address);

    // Addresses from your deployment
    const SBT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const MARKETPLACE_ADDRESS = "0x9A676e781A523b5d0C0e43731313A708CB607508";

    console.log("📄 SBT Contract:", SBT_ADDRESS);
    console.log("🏪 Marketplace:", MARKETPLACE_ADDRESS);

    // Get the contract instance
    const sbt = await hre.ethers.getContractAt("ReputationSBT", SBT_ADDRESS, deployer);

    // Check current owner
    const currentOwner = await sbt.owner();
    console.log("👤 Current Owner:", currentOwner);

    if (currentOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
        console.log("✅ Ownership is ALREADY correct! You can repay loans now.");
        return;
    }

    if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("❌ CRITICAL: The deployer is not the owner. Cannot transfer.");
        console.log("   The owner is:", currentOwner);
        return;
    }

    // Execute Transfer
    console.log("🚀 Transferring ownership to Marketplace...");
    // We use the raw transaction method if the function is not found on the interface for some reason, 
    // but simpler to try the direct call first.
    try {
        const tx = await sbt.transferOwnership(MARKETPLACE_ADDRESS);
        console.log("⏳ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Ownership Transferred Successfully!");
    } catch (error) {
        console.error("❌ Transfer failed:", error.message);
        // Fallback: ABI issue?
        console.log("⚠️ Attempting fallback transfer...");
        const ABI = ["function transferOwnership(address newOwner) public"];
        const sbtFallback = new hre.ethers.Contract(SBT_ADDRESS, ABI, deployer);
        const tx = await sbtFallback.transferOwnership(MARKETPLACE_ADDRESS);
        await tx.wait();
        console.log("✅ Ownership Transferred via Fallback!");
    }

    // Verify
    const newOwner = await sbt.owner();
    console.log("🎉 New Owner verified as:", newOwner);

    if (newOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
        console.log("\n✅ FIX COMPLETE. YOU CAN NOW REPAY LOANS.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
