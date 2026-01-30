async function main() {
    console.log("🌱 Seeding loan offers on-chain...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Get marketplace - update this address from your deployment
    const marketplaceAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
    console.log("LendingMarketplace:", marketplaceAddress);

    const marketplace = await ethers.getContractAt("LendingMarketplace", marketplaceAddress);

    // Create test offers
    console.log("\n📝 Creating offers...\n");

    // Offer 0: 1 ETH, Min Score 100
    console.log("Creating Offer #0: 1 ETH, Min Score 100");
    let tx = await marketplace.createOffer(100, {
        value: ethers.parseEther("1.0")
    });
    await tx.wait();
    console.log("✅ Offer #0 created");

    // Offer 1: 2 ETH, Min Score 200
    console.log("\nCreating Offer #1: 2 ETH, Min Score 200");
    tx = await marketplace.createOffer(200, {
        value: ethers.parseEther("2.0")
    });
    await tx.wait();
    console.log("✅ Offer #1 created");

    // Offer 2: 0.5 ETH, Min Score 50
    console.log("\nCreating Offer #2: 0.5 ETH, Min Score 50");
    tx = await marketplace.createOffer(50, {
        value: ethers.parseEther("0.5")
    });
    await tx.wait();
    console.log("✅ Offer #2 created");

    console.log("\n🎉 All offers created successfully!");
    console.log("\nRefresh your browser to see them in the UI.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
