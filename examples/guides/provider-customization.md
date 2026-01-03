# Provider Customization - Use Your Own Provider

## Overview

Inject custom EIP-1193 providers, wrap providers for compatibility, or use different wallet connectors.

## Default Provider (Auto-Detect)

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' }
  // No providerConfig = uses window.ethereum automatically
});
```

## Custom Provider

### Inject window.ethereum

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
  providerConfig: {
    provider: window.ethereum // Explicit MetaMask
  }
});
```

### Custom RPC Provider

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
  providerConfig: {
    provider: {
      request: async (args) => {
        // Custom RPC implementation
        const response = await fetch('https://your-rpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        return response.json();
      }
    }
  }
});
```

## With Provider Wrapper

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
  providerConfig: {
    provider: window.ethereum,
    wrapProvider: (provider) => {
      // Wrap provider for compatibility or add logging
      return {
        request: async (args) => {
          console.log('RPC Call:', args.method);
          return provider.request(args);
        }
      };
    }
  }
});
```

## Logging Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => ({
    request: async (args) => {
      console.log(`📤 RPC: ${args.method}`);
      console.log('Params:', args.params);
      
      try {
        const result = await provider.request(args);
        console.log('✅ Result:', result);
        return result;
      } catch (error) {
        console.error('❌ Error:', error);
        throw error;
      }
    }
  })
}
```

## Validation Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => ({
    request: async (args) => {
      // Only allow specific methods
      const allowedMethods = [
        'eth_requestAccounts',
        'eth_sendTransaction',
        'eth_call',
        'wallet_requestExecutionPermissions'
      ];

      if (!allowedMethods.includes(args.method)) {
        throw new Error(`Method ${args.method} not allowed`);
      }

      return provider.request(args);
    }
  })
}
```

## Rate Limiting Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => {
    const requestQueue = [];
    let processing = false;

    const processQueue = async () => {
      if (processing || requestQueue.length === 0) return;
      
      processing = true;
      const { args, resolve, reject } = requestQueue.shift();

      try {
        const result = await provider.request(args);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        processing = false;
        // Wait 100ms before next request
        setTimeout(processQueue, 100);
      }
    };

    return {
      request: (args) => {
        return new Promise((resolve, reject) => {
          requestQueue.push({ args, resolve, reject });
          processQueue();
        });
      }
    };
  }
}
```

## Caching Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => {
    const cache = new Map();

    return {
      request: async (args) => {
        const cacheKey = JSON.stringify(args);

        // Cache read-only calls
        if (['eth_call', 'eth_getBalance'].includes(args.method)) {
          if (cache.has(cacheKey)) {
            console.log('📦 Cache hit:', args.method);
            return cache.get(cacheKey);
          }
        }

        // Make request
        const result = await provider.request(args);

        // Cache result
        if (['eth_call', 'eth_getBalance'].includes(args.method)) {
          cache.set(cacheKey, result);
        }

        return result;
      }
    };
  }
}
```

## Retry Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => ({
    request: async (args, maxRetries = 3) => {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries}`);
          return await provider.request(args);
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            // Exponential backoff
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    }
  })
}
```

## Error Recovery Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => ({
    request: async (args) => {
      try {
        return await provider.request(args);
      } catch (error) {
        // Handle specific errors
        if (error.code === -32603) { // Internal error
          console.error('RPC server error, retrying...');
          return provider.request(args);
        }

        if (error.code === 4001) { // User rejected
          console.log('User rejected request');
          throw error;
        }

        if (error.message.includes('network')) {
          console.error('Network error');
          throw new Error('Network error - check connection');
        }

        throw error;
      }
    }
  })
}
```

## Metrics Wrapper

```typescript
providerConfig: {
  provider: window.ethereum,
  wrapProvider: (provider) => {
    const metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      responseTimes: []
    };

    return {
      request: async (args) => {
        const startTime = Date.now();
        metrics.totalRequests++;

        try {
          const result = await provider.request(args);
          metrics.successfulRequests++;

          const responseTime = Date.now() - startTime;
          metrics.responseTimes.push(responseTime);
          metrics.avgResponseTime = 
            metrics.responseTimes.reduce((a, b) => a + b, 0) / 
            metrics.responseTimes.length;

          return result;
        } catch (error) {
          metrics.failedRequests++;
          throw error;
        }
      },

      getMetrics: () => metrics
    };
  }
}
```

## Multi-Wallet Support

```typescript
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { MetaMaskConnector } from '@web3-react/metamask-connector';

// Choose wallet
const connector = isWalletConnect ? 
  new WalletConnectConnector() : 
  new MetaMaskConnector();

const provider = await connector.activate();

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
  providerConfig: {
    provider: provider.provider
  }
});
```

## Web3Modal Integration

```typescript
import { useWeb3Modal } from '@web3modal/ethers/react';

export function PermissionComponent() {
  const { provider } = useWeb3Modal();

  const createPermission = async () => {
    if (!provider) {
      alert('Please connect wallet');
      return;
    }

    const result = await requestAdvancedPermission({
      sessionAccountAddress: '0x...',
      permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
      providerConfig: {
        provider: provider.provider || provider
      }
    });

    console.log('Permission:', result);
  };

  return <button onClick={createPermission}>Create Permission</button>;
}
```

## RainbowKit Integration

```typescript
import { useAccount, useWalletClient } from 'wagmi';

export function PermissionComponent() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const createPermission = async () => {
    if (!walletClient) return;

    // RainbowKit provides injected provider via window.ethereum
    const result = await requestAdvancedPermission({
      sessionAccountAddress: '0x...',
      permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
      providerConfig: {
        provider: window.ethereum
      }
    });

    console.log('Permission:', result);
  };

  return <button onClick={createPermission}>Create Permission</button>;
}
```

## ConnectKit Integration

```typescript
import { useConnect } from 'wagmi';

export function PermissionComponent() {
  const { isConnected } = useAccount();

  const createPermission = async () => {
    if (!isConnected) {
      alert('Connect wallet first');
      return;
    }

    const result = await requestAdvancedPermission({
      sessionAccountAddress: '0x...',
      permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
      providerConfig: {
        provider: window.ethereum
      }
    });

    console.log('Permission:', result);
  };

  return <button onClick={createPermission}>Create Permission</button>;
}
```

Providers = total wallet flexibility! 🔌
