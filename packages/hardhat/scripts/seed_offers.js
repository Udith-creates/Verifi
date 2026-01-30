const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Get the deployed LendingMarketplace contract
    const LendingMarketplace = await hre.ethers.getContractFactory("LendingMarketplace");
    const deployments = await hre.deployments.all();

    if (!deployments.LendingMarketplace) {
        console.error("LendingMarketplace not deployed yet!");
        return;
    }

    const marketplace = await hre.ethers.getContractAt(
        "LendingMarketplace",
        deployments.LendingMarketplace.address
    );

    console.log("Seeding offers to LendingMarketplace at:", deployments.LendingMarketplace.address);

    // Offer #0: 1.5 ETH, Score 120
    const tx1 = await marketplace.createOffer(120, {
        value: hre.ethers.parseEther("1.5")
    });
    await tx1.wait();
    console.log("✅ Seeded Offer #0: 1.5 ETH, Min Score 120");

    // Offer #1: 5.0 ETH, Score 500
    const tx2 = await marketplace.createOffer(500, {
        value: hre.ethers.parseEther("5.0")
    });
    await tx2.wait();
    console.log("✅ Seeded Offer #1: 5.0 ETH, Min Score 500");

    console.log("\n🎉 Seeding complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
