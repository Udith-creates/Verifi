const hre = require("hardhat");

async function main() {
    console.log("🔐 Transferring SBT ownership to Marketplace...\n");

    // Get deployed addresses
    const deployments = await hre.deployments.all();
    const sbtAddress = deployments.ReputationSBT.address;
    const marketplaceAddress = deployments.LendingMarketplace.address;

    console.log("ReputationSBT:", sbtAddress);
    console.log("LendingMarketplace:", marketplaceAddress);

    // Get contract instance
    const [signer] = await hre.ethers.getSigners();
    const sbt = await hre.ethers.getContractAt("ReputationSBT", sbtAddress, signer);

    // Transfer ownership
    console.log("\nTransferring ownership...");
    const tx = await sbt.transferOwnership(marketplaceAddress);
    await tx.wait();

    console.log("✅ SBT ownership transferred to Marketplace!");
    console.log("Marketplace can now mint SBTs when loans are repaid.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
