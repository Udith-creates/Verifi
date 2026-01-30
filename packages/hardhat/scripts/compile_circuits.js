const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const snarkjs = require('snarkjs');
const https = require('https');

const buildDir = path.join(__dirname, '../circuits/build');
const circuitsDir = path.join(__dirname, '../circuits');
const contractsDir = path.join(__dirname, '../contracts');
const publicDir = path.join(__dirname, '../../nextjs/public/circuits');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}


// 1. Compile Circuit
if (!fs.existsSync(path.join(buildDir, 'creditScore.r1cs'))) {
    console.log("Compiling circuit...");
    let circomCmd = "circom";
    const localCircom = path.join(__dirname, '../bin/circom.exe');
    if (fs.existsSync(localCircom)) {
        circomCmd = localCircom;
        console.log("Using local circom:", circomCmd);
    }

    try {
        const output = execSync(`${circomCmd} "${path.join(circuitsDir, 'creditScore.circom')}" --r1cs --wasm --sym --c -o "${buildDir}" -l "${path.join(__dirname, '../node_modules')}"`, { encoding: 'utf8' });
        console.log(output);
    } catch (e) {
        console.error("Compilation failed:", e.message);
        process.exit(1);
    }
} else {
    console.log("Circuit already compiled, skipping...");
}

// 2. Download PTAU
const ptauPath = path.join(buildDir, 'pot12_final.ptau');
const ptauUrl = "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau";

async function downloadPtau() {
    if (!fs.existsSync(ptauPath)) {
        console.log("Downloading Powers of Tau...");
        const file = fs.createWriteStream(ptauPath);
        return new Promise((resolve, reject) => {
            https.get(ptauUrl, function (response) {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download locally: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(ptauPath, () => { });
                reject(err);
            });
        });
    }
}

async function runSnarkJS() {
    // console.log("SnarkJS Keys:", Object.keys(snarkjs));
    console.log("Checking PTAU...");
    await downloadPtau();
    console.log("PTAU Ready.");

    const r1csFile = path.join(buildDir, "creditScore.r1cs");
    const zkey0 = path.join(buildDir, "circuit_0000.zkey");
    const zkeyFinal = path.join(buildDir, "circuit_final.zkey");
    const vKeyFile = path.join(buildDir, "verification_key.json");
    const verifierSol = path.join(buildDir, "Verifier.sol");

    // 3. Setup (Groth16)
    console.log("Generating zkey (Setup)...");
    try {
        await snarkjs.zKey.newZKey(r1csFile, ptauPath, zkey0);
        console.log("Setup complete.");
    } catch (e) {
        console.error("Error in Setup:", e);
        throw e;
    }

    // 4. Contribute
    console.log("Contributing to zkey...");
    await snarkjs.zKey.contribute(zkey0, zkeyFinal, "1st Contributor", "RandomEntropy12345");

    // 5. Export Verification Key
    console.log("Exporting verification key...");
    const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFinal);
    fs.writeFileSync(vKeyFile, JSON.stringify(vKey, null, 2));

    // 6. Export Solidity Verifier
    console.log("Exporting Solidity Verifier...");
    try {
        // Try global npx first, then assume local install path in hardhat workspace
        const localBin = path.join(__dirname, '../node_modules/.bin/snarkjs.cmd');
        if (fs.existsSync(localBin)) {
            execSync(`"${localBin}" zkey export solidityverifier "${zkeyFinal}" "${verifierSol}"`, { stdio: 'inherit' });
        } else {
            execSync(`npx snarkjs zkey export solidityverifier "${zkeyFinal}" "${verifierSol}"`, { stdio: 'inherit' });
        }
    } catch (e) {
        console.error("Failed to export verifier via CLI", e);
        // Fallback or ignore
    }

    // 7. Move Files
    console.log("Moving files...");

    // Move Verifier.sol
    fs.copyFileSync(verifierSol, path.join(contractsDir, 'Verifier.sol'));

    // Move public files
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.copyFileSync(path.join(buildDir, 'creditScore_js/creditScore.wasm'), path.join(publicDir, 'creditScore.wasm'));
    fs.copyFileSync(zkeyFinal, path.join(publicDir, 'circuit_final.zkey'));
    fs.copyFileSync(vKeyFile, path.join(publicDir, 'verification_key.json'));

    console.log("Circuits compiled and artifacts moved!");
}

runSnarkJS().catch(console.error);
