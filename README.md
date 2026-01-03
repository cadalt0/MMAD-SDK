# MMAD SDK - MetaMask Advanced Permissions SDK

**Create MetaMask Advanced Permissions (ERC-7715) in just 3 lines of code.**

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' }
});
```

That's it. Full ERC-7715 permission delegation with smart defaults and 100% customization.

---

## Installation

```bash
npm install mmad-sdk
```


## Quick Start

### Create Permission (1 minute)

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  }
});
```

### Redeem Permission (1 minute)

```typescript
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: previousResult,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  tokenDecimals: 6,
  backendEndpoint: '/api/redeem'
});
```

## Permission Types

| Type | Use Case |
|------|----------|
| `native-token-periodic` | Fixed ETH amount per day/week/etc |
| `erc20-token-periodic` | Fixed token amount per day/week/etc |
| `native-token-stream` | Linear ETH streaming (0.0001 ETH/sec) |
| `erc20-token-stream` | Linear token streaming (0.1 USDC/sec) |

## Smart Defaults

Without specifying anything:
- **Periodic**: 1 unit per day, expires in 1 week
- **Stream**: 0.00001 units/sec, starts now, max 1 unit
- **Decimals**: 18 for native, 6 for ERC-20
- **Adjustment**: Allowed (user can modify)

## Core APIs

### requestAdvancedPermission()

Create an advanced permission request.

```typescript
const result = await requestAdvancedPermission({
  // Session account that will execute transfers
  sessionAccountAddress: '0x1234...',
  
  // Permission details
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0xUSDC...',
    amount: '100',              // Optional - uses default if omitted
    periodDuration: 86400,      // Optional - 1 day default
    // ... or for streams:
    amountPerSecond: '0.1',     // Optional
    initialAmount: '1',         // Optional
    maxAmount: '100',           // Optional
  },
  
  // Optional customizations
  userAddress: '0xuser...',     // Auto-detected if omitted
  chain: sepolia,               // Sepolia by default
  walletClient: customClient,   // Uses default if omitted
  providerConfig: {             // Custom provider
    provider: window.ethereum,
    wrapProvider: (p) => p
  },
  hooks: {                       // Lifecycle hooks
    beforeBuild: (req) => req,
    beforeRequest: (req) => req,
    afterRequest: (res) => {},
    onError: (err) => {}
  }
});

// Returns:
// {
//   permissionContext: string,
//   delegationManager: string,
//   request: object,
//   response: object,
//   userAddress: string,
//   sessionAccount: object
// }
```

### redeemPermission()

Redeem a permission to execute transfers.

```typescript
const result = await redeemPermission({
  // From previous requestAdvancedPermission result
  permissionsContext: previousResult,
  
  // Redemption details
  recipient: '0xrecipient...',
  amount: '50',
  permissionType: 'erc20-token-periodic',
  
  // Optional for ERC-20
  tokenAddress: '0xUSDC...',
  tokenDecimals: 6,
  
  // Optional customizations
  chainId: 11155111,
  sessionAccountAddress: '0x...',
  
  // Choose execution method
  backendEndpoint: '/api/redeem',  // OR
  customRedeem: async (opts) => {
    // Your execution logic
    return { success: true, txHash: '0x...' };
  },
  
  hooks: {
    beforeBuild: (req) => req,
    beforeRequest: (req) => req,
    afterRequest: (res) => {},
    onError: (err) => {}
  }
});

// Returns:
// {
//   success: boolean,
//   message?: string,
//   redeemRequest?: object,
//   transactionHash?: string,
//   ...
// }
```

### autoRedeem() (2 lines, built-in call data)

```typescript
import { autoRedeem } from 'mmad-sdk';

const result = await autoRedeem({
  permissionsContext: previousResult.permissionsContext,
  recipient: '0xrecipient...',
  amount: '0.05'
});

// Default: posts to /api/redeem (no private key on client)
// Optional wallet path (builds calldata + sends tx):
// await autoRedeem({
//   permissionsContext,
//   recipient,
//   amount: '0.05',
//   permissionType: 'native-token-periodic',
//   delegationManager: '0xDelegationManager',
//   walletClient
// });
```

### buildRedeemCallData() (advanced)

```typescript
import { buildRedeemCallData } from 'mmad-sdk';

const tx = buildRedeemCallData({
  permissionsContext,
  recipient: '0xrecipient...',
  amount: '0.05',
  permissionType: 'native-token-periodic',
  delegationManager: '0xDelegationManager'
});

// tx: { to, data, value } ready for sendTransaction
```

## Examples

See the `/examples/guides` folder for detailed examples:

- **[Basic Usage](./examples/guides/basic-usage.md)** - Create and redeem in 2-3 lines
- **[Periodic Permissions](./examples/guides/permissions-periodic.md)** - Fixed amount per period
- **[Stream Permissions](./examples/guides/permissions-stream.md)** - Linear streaming
- **[Redeem with Backend](./examples/guides/redeem-backend.md)** - Submit to your API
- **[Redeem Custom](./examples/guides/redeem-custom.md)** - Custom execution logic
- **[Hooks Customization](./examples/guides/hooks-customization.md)** - Lifecycle hooks
- **[Provider Customization](./examples/guides/provider-customization.md)** - Custom provider
- **[Error Handling](./examples/guides/error-handling.md)** - Complete error guide
- **[Complete Example](./examples/guides/complete-example.md)** - Full app example

## Supported Chains

All official ERC-7715 chains:

**Mainnet**: Ethereum, Polygon, Arbitrum One, Arbitrum Nova, Optimism, Base, BSC, Gnosis, Citrea, Monad, Berachain, Unichain, MegaEth

**Testnet**: Sepolia, Polygon Amoy, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia, BSC Testnet, Berachain Bepolia, Hoodi, Chiado, Unichain Sepolia

## TypeScript Support

Full type safety:

```typescript
import type {
  AdvancedPermissionParams,
  RequestAdvancedPermissionOptions,
  RedeemPermissionOptions,
  PermissionHooks,
  RedeemHooks,
  PermissionType
} from 'mmad-sdk';
```

## Error Handling

```typescript
import {
  MissingBrowserProviderError,
  UserRejectedError,
  InvalidPermissionConfigError,
  MissingRequestExecutionPermissionsError
} from 'mmad-sdk';

try {
  await requestAdvancedPermission({...});
} catch (err) {
  if (err instanceof UserRejectedError) {
    console.log('User rejected');
  } else if (err instanceof InvalidPermissionConfigError) {
    console.log('Invalid config:', err.message);
  }
}
```
