# Wallet Connection Guide for VeriFi

## 🦊 MetaMask Setup for Local Development

### Step 1: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click the network dropdown (top center)
3. Click "Add Network" or "Add a network manually"
4. Enter the following details:

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

5. Click "Save"

### Step 2: Import Test Account

Hardhat provides test accounts with ETH. Import one of these:

**Account #0 (Recommended)**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Balance: 10000 ETH
```

**Account #1**
```
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Balance: 10000 ETH
```

**How to Import:**
1. Click MetaMask icon
2. Click account icon (top right)
3. Click "Import Account"
4. Paste the private key above
5. Click "Import"

### Step 3: Connect to the DApp

1. Go to http://localhost:3001
2. Click "Connect Wallet" button (top right)
3. Select MetaMask
4. Approve the connection
5. Make sure "Hardhat Local" network is selected

### Step 4: Reset Account (If Needed)

If you see nonce errors or transactions fail:

1. Click MetaMask icon
2. Click account icon → Settings
3. Advanced → Clear activity tab data
4. Confirm

This resets the transaction history for the local network.

## 🔧 Troubleshooting

### Issue: "Wrong Network" Warning
**Solution**: Switch MetaMask to "Hardhat Local" network

### Issue: "Insufficient Funds"
**Solution**: Make sure you imported a test account with ETH

### Issue: "Connection Refused"
**Solution**: 
- Ensure `yarn chain` is running
- Check that RPC is at http://127.0.0.1:8545
- Try http://localhost:8545 instead

### Issue: Transactions Stuck/Pending
**Solution**:
1. Stop `yarn chain` (Ctrl+C)
2. Restart with `yarn chain`
3. Reset MetaMask account (see Step 4)
4. Redeploy contracts: `yarn deploy --reset`

### Issue: "Nonce too high" Error
**Solution**: Reset MetaMask account activity (Step 4)

## 🎯 Quick Test

After connecting:
1. Your address should show in top-right corner
2. Balance should show ~10000 ETH
3. Network indicator should say "Hardhat Local" or "31337"

## 📱 Alternative: Use Scaffold-ETH Burner Wallet

If MetaMask doesn't work, Scaffold-ETH has a built-in burner wallet:

1. Look for "Generate" button in top-right
2. Click it to create a temporary wallet
3. It auto-connects to localhost:8545
4. Use for testing (don't use for real funds!)

---

**Need Help?** Make sure both `yarn chain` and `yarn start` are running!
