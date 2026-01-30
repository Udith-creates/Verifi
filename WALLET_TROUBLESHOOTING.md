# Wallet Connection Troubleshooting

## Current Configuration ✅

Your system is now configured with:
- **RPC Override**: Explicitly set to `http://127.0.0.1:8545` for chain 31337
- **Wallet Options**: MetaMask and all other wallets are now enabled (not just burner wallet)
- **Target Network**: Hardhat (Chain ID 31337)

## What Changed

I made 2 critical fixes to `scaffold.config.ts`:

1. **Added RPC Override**:
   ```ts
   rpcOverrides: {
     31337: "http://127.0.0.1:8545",
   }
   ```
   This forces the frontend to connect to your local chain.

2. **Enabled All Wallets**:
   ```ts
   onlyLocalBurnerWallet: false,
   ```
   This allows MetaMask and other wallets to appear in the connection menu.

## Steps to Connect Now

### 1. Hard Refresh the Page
Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac) to clear the cache and reload.

### 2. Look for "Connect Wallet" Button
You should see a button in the top-right corner. Click it.

### 3. Select MetaMask
You should now see multiple wallet options including MetaMask.

### 4. Approve Connection
- Make sure MetaMask is on "Hardhat Local" network (Chain ID 31337)
- Approve the connection request

### 5. Verify Connection
You should see:
- Your wallet address in the top-right
- Your ETH balance (~10000 ETH if using test account)
- Network indicator showing "Hardhat" or "31337"

## If Still Not Working

### Option A: Use the Burner Wallet (Fastest)
1. Look for a "Generate" or wallet icon button
2. Click it to create a temporary test wallet
3. This auto-connects and works immediately

### Option B: Check MetaMask Network
1. Open MetaMask
2. Verify network settings:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545` (NOT localhost)
   - **Chain ID**: `31337`
3. Switch to this network
4. Refresh the page

### Option C: Reset Everything
```bash
# Stop all processes (Ctrl+C in each terminal)

# Terminal 1: Restart chain
yarn chain

# Terminal 2: Redeploy contracts
yarn deploy --reset

# Terminal 3: Restart frontend
yarn start
```

Then:
1. Reset MetaMask account: Settings → Advanced → Clear activity tab data
2. Hard refresh browser: Ctrl + Shift + R
3. Try connecting again

## Debug Checklist

- [ ] `yarn chain` is running (Terminal 1)
- [ ] `yarn start` is running (Terminal 3)
- [ ] Frontend is at `http://localhost:3001`
- [ ] MetaMask has "Hardhat Local" network configured
- [ ] MetaMask is switched to "Hardhat Local" (Chain ID 31337)
- [ ] Test account is imported (private key: 0xac0974...)
- [ ] Browser cache cleared (Ctrl + Shift + R)

## What to Look For

**Success indicators:**
- ✅ Wallet address visible in top-right
- ✅ ETH balance showing
- ✅ Network badge shows "Hardhat" or "31337"
- ✅ "Create Offer" button is clickable

**Failure indicators:**
- ❌ "Wrong Network" warning
- ❌ "Connect Wallet" button does nothing
- ❌ No wallet options appear
- ❌ Console errors about RPC

---

**Next.js should auto-reload** when you save files. If you see the changes take effect, try connecting your wallet now!
