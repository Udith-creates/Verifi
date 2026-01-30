const hre = require("hardhat");

async function main() {
    console.log("🔐 Transferring SBT Ownership...\n");

    const SBT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const MARKETPLACE_ADDRESS = "0x9A676e781A523b5d0C0e43731313A708CB607508";

    console.log("ReputationSBT:", SBT_ADDRESS);
    console.log("Marketplace:", MARKETPLACE_ADDRESS);

    const sbt = await hre.ethers.getContractAt("ReputationSBT", SBT_ADDRESS);

    console.log("\nTransferring ownership...");
    const tx = await sbt.transferOwnership(MARKETPLACE_ADDRESS);
    console.log("TX:", tx.hash);

    await tx.wait();
    console.log("✅ Done! Marketplace can now mint SBTs when you repay loans.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
