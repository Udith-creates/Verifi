async function main() {
    const [signer] = await ethers.getSigners();

    console.log("🔐 Transferring SBT ownership...\n");
    console.log("Signer:", signer.address);

    // Hardcode addresses from deployment
    const sbtAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Update this after deployment
    const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Update this after deployment

    const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
    const sbt = ReputationSBT.attach(sbtAddress);

    console.log("Transferring ownership to:", marketplaceAddress);
    const tx = await sbt.transferOwnership(marketplaceAddress);
    await tx.wait();

    console.log("✅ Done!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
