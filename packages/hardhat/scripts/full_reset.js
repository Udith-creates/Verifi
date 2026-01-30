const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log("🔥 STARTING FULL RESET RESET & REDEPLOY 🔥");

    const hardhatDir = path.join(__dirname, '..');

    // 1. Clean Build Directory
    const buildDir = path.join(hardhatDir, 'circuits/build');
    if (fs.existsSync(buildDir)) {
        console.log("Cleaning build directory...");
        fs.rmSync(buildDir, { recursive: true, force: true });
    }

    // 2. Run Circuit Compiler
    console.log("\n⚡ Compiling Circuits (this may take a minute)...");
    try {
        execSync('node scripts/compile_circuits.js', {
            cwd: hardhatDir,
            stdio: 'inherit'
        });
    } catch (e) {
        console.error("❌ Circuit compilation failed!");
        process.exit(1);
    }

    // 3. Deploy Contracts
    console.log("\n🚀 Deploying Smart Contracts...");
    try {
        execSync('yarn deploy --reset', {
            cwd: hardhatDir,
            stdio: 'inherit'
        });
    } catch (e) {
        console.error("❌ Deployment failed!");
        process.exit(1);
    }

    // 4. Fix Ownership
    console.log("\n🔐 Transferring Ownership...");
    try {
        execSync('yarn hardhat run scripts/auto_fix.js --network localhost', {
            cwd: hardhatDir,
            stdio: 'inherit'
        });
    } catch (e) {
        console.error("❌ Ownership transfer failed!");
        process.exit(1);
    }

    console.log("\n✅ ALL DONE! SYSTEM IS FULLY SYNCED AND READY.");
    console.log("👉 Please REFRESH your frontend browser now.");
}

main().catch(console.error);
