const hre = require("hardhat");

async function main() {
    console.log("🕵️‍♂️ AUTO-FIXING OWNERSHIP...");

    const [deployer] = await hre.ethers.getSigners();

    // 1. Get MOST RECENT deployment addresses
    const LendingMarketplaceDep = await hre.deployments.get("LendingMarketplace");
    const ReputationSBTDep = await hre.deployments.get("ReputationSBT");

    const MARKETPLACE_ADDRESS = LendingMarketplaceDep.address;
    const SBT_ADDRESS = ReputationSBTDep.address;

    console.log("📄 SBT Address:", SBT_ADDRESS);
    console.log("🏪 Marketplace Address:", MARKETPLACE_ADDRESS);

    // 2. Connect
    const sbt = await hre.ethers.getContractAt("ReputationSBT", SBT_ADDRESS, deployer);

    // 3. Check Owner
    const currentOwner = await sbt.owner();
    console.log("👤 Current Owner:", currentOwner);
    console.log("🔑 Deployer Is:  ", deployer.address);

    // 4. Transfer
    if (currentOwner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
        console.log("✅ ALREADY DONE.");
    } else {
        console.log("🚀 Transferring... (Gas Limit: 5000000)");
        // Manually setting gas limit helps override estimation errors if they stem from weird local state
        const tx = await sbt.transferOwnership(MARKETPLACE_ADDRESS, { gasLimit: 5000000 });
        await tx.wait();
        console.log("✅ FIXED! Ownership transferred.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
