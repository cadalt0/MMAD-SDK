# Redeem Custom - Complete Control

## Overview

Use `customRedeem` to handle redemption execution yourself. Full control over how and when transactions execute.

## Basic Custom Redeem

```typescript
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: previousResult,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  tokenDecimals: 6,
  
  // Custom execution logic
  customRedeem: async (options) => {
    console.log('Executing custom redeem...', options);
    
    // Your logic here
    return {
      success: true,
      message: 'Custom redemption complete',
      transactionHash: '0x...'
    };
  }
});
```

## With Viem - Execute Directly

```typescript
import { createWalletClient, custom } from 'viem';
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: previousResult,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  tokenDecimals: 6,
  
  customRedeem: async (options) => {
    // Create wallet client
    const walletClient = createWalletClient({
      transport: custom(window.ethereum)
    });

    // Get accounts
    const [account] = await walletClient.getAddresses();

    // Execute transaction
    const txHash = await walletClient.writeContract({
      account,
      address: options.tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [options.recipient, BigInt(options.amount)]
    });

    return {
      success: true,
      transactionHash: txHash,
      message: 'Transfer executed'
    };
  }
});
```

## With Ethers.js - Alternative

```typescript
import { ethers } from 'ethers';
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: previousResult,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  tokenDecimals: 6,
  
  customRedeem: async (options) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const contract = new ethers.Contract(
      options.tokenAddress,
      ERC20_ABI,
      signer
    );

    const tx = await contract.transfer(
      options.recipient,
      ethers.parseUnits(options.amount, options.tokenDecimals)
    );

    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.hash,
      message: 'Transfer completed'
    };
  }
});
```

## With Logging

```typescript
customRedeem: async (options) => {
  console.log('=== Redemption Started ===');
  console.log('Recipient:', options.recipient);
  console.log('Amount:', options.amount);
  console.log('Permission Type:', options.permissionType);
  console.log('Token:', options.tokenAddress);

  try {
    // Execute
    const txHash = await executeTransaction(options);
    
    console.log('✅ Success! TX:', txHash);
    return {
      success: true,
      transactionHash: txHash
    };
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}
```

## With Validation

```typescript
customRedeem: async (options) => {
  // Validate amount
  const amount = parseFloat(options.amount);
  if (amount <= 0 || amount > 10000) {
    throw new Error('Amount out of range');
  }

  // Validate recipient
  if (!options.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid recipient address');
  }

  // Validate permission type
  const validTypes = [
    'erc20-token-periodic',
    'native-token-periodic',
    'erc20-token-stream',
    'native-token-stream'
  ];
  if (!validTypes.includes(options.permissionType)) {
    throw new Error('Invalid permission type');
  }

  // Check user approval
  const isApproved = await checkUserApproval(options);
  if (!isApproved) {
    throw new Error('User not approved for this redemption');
  }

  // Execute
  return await executeTransaction(options);
}
```

## With Confirmation Dialog

```typescript
customRedeem: async (options) => {
  // Show confirmation dialog
  const confirmed = await new Promise((resolve) => {
    const dialog = showConfirmDialog({
      title: 'Confirm Redemption',
      message: `Transfer ${options.amount} tokens to ${options.recipient}?`,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });

  if (!confirmed) {
    throw new Error('User cancelled');
  }

  // Execute
  return await executeTransaction(options);
}
```

## With Retry Logic

```typescript
customRedeem: async (options) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      return await executeTransaction(options);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}
```

## With Gas Estimation

```typescript
customRedeem: async (options) => {
  const client = createPublicClient({ /* config */ });
  
  // Estimate gas
  const gasEstimate = await client.estimateGas({
    account: sessionAccount,
    to: options.tokenAddress,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [options.recipient, BigInt(options.amount)]
    })
  });

  console.log('Estimated gas:', gasEstimate);

  // Check if gas is too high
  if (gasEstimate > 500000n) {
    throw new Error('Gas cost too high');
  }

  // Execute with estimated gas
  const txHash = await walletClient.writeContract({
    // ... args
    gas: gasEstimate
  });

  return { success: true, transactionHash: txHash };
}
```

## With Event Tracking

```typescript
customRedeem: async (options) => {
  const eventId = `redeem-${Date.now()}`;
  
  try {
    // Track start
    trackEvent('redeem_started', {
      eventId,
      permissionType: options.permissionType,
      amount: options.amount
    });

    // Execute
    const txHash = await executeTransaction(options);

    // Track success
    trackEvent('redeem_success', {
      eventId,
      transactionHash: txHash
    });

    return { success: true, transactionHash: txHash };
  } catch (error) {
    // Track failure
    trackEvent('redeem_failed', {
      eventId,
      error: error.message
    });

    throw error;
  }
}
```

## With Polling (Wait for Confirmation)

```typescript
customRedeem: async (options) => {
  const txHash = await submitTransaction(options);
  
  // Poll for confirmation
  const maxAttempts = 60; // 5 minutes at 5 second intervals
  let confirmed = false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    
    if (receipt?.blockNumber) {
      confirmed = true;
      console.log('✅ Confirmed in block:', receipt.blockNumber);
      break;
    }

    console.log(`Waiting for confirmation... (${attempt + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  if (!confirmed) {
    throw new Error('Transaction timeout');
  }

  return { success: true, transactionHash: txHash };
}
```

## With Batch Processing

```typescript
customRedeem: async (options) => {
  const batchSize = 10;
  const recipients = [
    { address: options.recipient, amount: options.amount }
    // ... more recipients
  ];

  const txHashes = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    for (const recipient of batch) {
      const txHash = await executeTransfer({
        ...options,
        recipient: recipient.address,
        amount: recipient.amount
      });
      
      txHashes.push(txHash);
    }

    // Wait between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return {
    success: true,
    message: `Processed ${txHashes.length} transfers`,
    transactionHashes: txHashes
  };
}
```

## React Hook Example

```typescript
function useCustomRedeem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (permissionResult) => {
    setLoading(true);
    setError(null);

    try {
      const result = await redeemPermission({
        ...permissionResult,
        customRedeem: async (options) => {
          // Your custom logic
          const txHash = await myExecutionLogic(options);
          return { success: true, transactionHash: txHash };
        }
      });

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

// Usage
const { execute, loading, error } = useCustomRedeem();

const handleRedeem = async () => {
  try {
    const result = await execute(permissionResult);
    alert('Success! TX: ' + result.transactionHash);
  } catch (err) {
    alert('Error: ' + err.message);
  }
};
```

Custom redeem = ultimate flexibility! 🎯
