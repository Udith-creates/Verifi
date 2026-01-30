import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    const ethers = hre.ethers;

    console.log("🚀 Deploying VeriFi Protocol with IPFS Badge...");

    // 1. Deploy Verifier
    const verifierDeployment = await deploy("Groth16Verifier", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
    });
    console.log("✅ Verifier deployed at:", verifierDeployment.address);

    // 2. Deploy ReputationSBT (New IPFS version)
    const sbtDeployment = await deploy("ReputationSBT", {
        from: deployer,
        args: [], // No args needed, URI is constant
        log: true,
        autoMine: true,
    });
    console.log("✅ ReputationSBT deployed at:", sbtDeployment.address);

    // 3. Deploy LendingMarketplace
    const marketplaceDeployment = await deploy("LendingMarketplace", {
        from: deployer,
        args: [verifierDeployment.address, sbtDeployment.address],
        log: true,
        autoMine: true,
    });
    console.log("✅ LendingMarketplace deployed at:", marketplaceDeployment.address);

    // 4. Transfer Ownership Logic based on Deployment
    // We check if the owner is already the marketplace to avoid failing on redeploy
    const sbtContract = await ethers.getContractAt("ReputationSBT", sbtDeployment.address);
    const currentOwner = await sbtContract.owner();

    if (currentOwner.toLowerCase() !== marketplaceDeployment.address.toLowerCase()) {
        console.log("🔐 Transferring SBT ownership to Marketplace...");
        try {
            const tx = await sbtContract.transferOwnership(marketplaceDeployment.address);
            await tx.wait();
            console.log("✅ SBT Ownership Transferred!");
        } catch (error) {
            console.log("⚠️  Could not transfer ownership automatically. Please use 'yarn hardhat run scripts/transfer_ownership.js --network localhost'");
        }
    } else {
        console.log("✅ Ownership already correct.");
    }
};

export default deployMarketplace;
deployMarketplace.tags = ["LendingMarketplace", "ReputationSBT"];
