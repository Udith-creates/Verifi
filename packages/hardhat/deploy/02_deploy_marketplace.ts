import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    // 1. Deploy Verifier
    const verifierDeployment = await deploy("Groth16Verifier", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
    });

    console.log("Verifier deployed at:", verifierDeployment.address);

    // 2. Deploy LendingMarketplace
    const marketplaceDeployment = await deploy("LendingMarketplace", {
        from: deployer,
        args: [verifierDeployment.address],
        log: true,
        autoMine: true,
    });

    console.log("LendingMarketplace deployed at:", marketplaceDeployment.address);
};

export default deployMarketplace;
deployMarketplace.tags = ["LendingMarketplace"];
