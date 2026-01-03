# Stream Permissions - Linear Streaming

## Overview

Stream permissions allow tokens to flow linearly over time with:
- **Initial amount**: Released at start
- **Amount per second**: Accrues linearly
- **Max amount**: Cannot exceed total

**Examples:**
- 1 USDC at start + 0.1 USDC/sec = 100+ USDC in 16 minutes
- 0.1 ETH at start + 0.0001 ETH/sec = 1 ETH in ~2.5 hours

## ERC-20 Stream Permission

### Minimal (Using Defaults)

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC
  }
});

// Defaults:
// - amountPerSecond: 0.00001 USDC/sec
// - initialAmount: 0.1 USDC (released immediately)
// - maxAmount: 1 USDC (total max)
// - startTime: now
// - expiry: 1 week from now
// - decimals: 6
```

### With Custom Rates

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amountPerSecond: '0.1',    // 0.1 USDC per second
    initialAmount: '1',         // 1 USDC upfront
    maxAmount: '100'            // Can stream up to 100 USDC
  }
});

// Example timeline:
// t=0: 1 USDC available
// t=60: 1 + (0.1 * 60) = 7 USDC available
// t=600: 1 + (0.1 * 600) = 61 USDC available
// max: 100 USDC (total limit)
```

### Minimal Stream (Slow)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amountPerSecond: '0.001',   // 0.001 USDC/sec (slow)
    initialAmount: '0.1',
    maxAmount: '10'
  }
});

// 0.001 * 3600 * 24 = 86.4 USDC/day
```

### Fast Stream (High Rate)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amountPerSecond: '1',       // 1 USDC/sec (fast!)
    initialAmount: '10',
    maxAmount: '1000'
  }
});

// 1 * 3600 * 24 = 86,400 USDC/day
```

### With Custom Expiry

```typescript
const currentTime = Math.floor(Date.now() / 1000);

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amountPerSecond: '0.1',
    initialAmount: '1',
    maxAmount: '100',
    expiry: currentTime + 2592000 // 30 days
  }
});
```

### With Future Start Time

```typescript
const currentTime = Math.floor(Date.now() / 1000);
const startInOneDay = currentTime + 86400;

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amountPerSecond: '0.1',
    initialAmount: '1',
    maxAmount: '100',
    startTime: startInOneDay // Stream starts in 1 day
  }
});
```

### Fully Customized

```typescript
const currentTime = Math.floor(Date.now() / 1000);

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenDecimals: 6,
    amountPerSecond: '0.5',
    initialAmount: '10',
    maxAmount: '500',
    startTime: currentTime + 86400, // Start tomorrow
    expiry: currentTime + 7776000,  // 90 days
    justification: 'Streaming salary over 90 days',
    isAdjustmentAllowed: true
  }
});
```

## Native ETH Stream Permission

### Minimal

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-stream'
  }
});

// Defaults:
// - amountPerSecond: 0.00001 ETH/sec
// - initialAmount: 0.1 ETH
// - maxAmount: 1 ETH
```

### Custom ETH Stream

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-stream',
    amountPerSecond: '0.0001',  // 0.0001 ETH/sec
    initialAmount: '0.1',
    maxAmount: '1'
  }
});

// t=0: 0.1 ETH
// t=3600: 0.1 + (0.0001 * 3600) = 0.46 ETH
// max: 1 ETH
```

### Fast Streaming

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-stream',
    amountPerSecond: '0.001',   // 0.001 ETH/sec
    initialAmount: '1',
    maxAmount: '10'
  }
});

// 0.001 * 3600 * 24 = 86.4 ETH/day (very fast!)
```

## Stream Calculations

### Daily Rate from Per-Second

```
amountPerSecond * 86400 = amountPerDay

Examples:
- 0.00001 * 86400 = 0.864 tokens/day
- 0.0001 * 86400 = 8.64 tokens/day
- 0.001 * 86400 = 86.4 tokens/day
- 0.1 * 86400 = 8,640 tokens/day
- 1 * 86400 = 86,400 tokens/day
```

### How Long to Reach Max

```
Time = (maxAmount - initialAmount) / amountPerSecond

Examples:
- Max 100, Initial 1, Rate 0.1 = (100-1)/0.1 = 990 seconds (~16 min)
- Max 1, Initial 0.1, Rate 0.0001 = (1-0.1)/0.0001 = 9000 seconds (~2.5 hours)
- Max 1000, Initial 10, Rate 1 = (1000-10)/1 = 990 seconds (~16 min)
```

## Use Cases

### Salary Streaming (3 months)

```typescript
const currentTime = Math.floor(Date.now() / 1000);

await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0xUSDC',
    amountPerSecond: String(30000 / (90 * 86400)), // 30,000 USDC over 90 days
    initialAmount: '1000', // 1000 USDC upfront
    maxAmount: '30000',    // Total 30,000
    startTime: currentTime,
    expiry: currentTime + (90 * 86400) // 90 days
  }
});
```

### DeFi Liquidity Provision

```typescript
await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0xDAI',
    amountPerSecond: '0.1',    // 0.1 DAI/sec
    initialAmount: '100',      // 100 DAI upfront
    maxAmount: '10000'         // Max 10,000 DAI
  }
});
```

### Milestone Payments (VCS)

```typescript
const currentTime = Math.floor(Date.now() / 1000);
const sixMonths = 6 * 30 * 86400;

await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0xUSDC',
    amountPerSecond: String(50000 / sixMonths),
    initialAmount: '5000',  // 5000 upfront
    maxAmount: '50000',     // Total 50,000 over 6 months
    expiry: currentTime + sixMonths
  }
});
```

### Vesting Schedule

```typescript
await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-stream',
    tokenAddress: '0xLINK',
    amountPerSecond: String(100000 / (365 * 86400)), // 100k over 1 year
    initialAmount: '0',     // Nothing upfront
    maxAmount: '100000',    // Max 100k
    startTime: Math.floor(Date.now() / 1000) + (30 * 86400), // Cliff 30 days
    expiry: Math.floor(Date.now() / 1000) + (365 * 86400)
  }
});
```

Stream permissions = money flowing like water over time ✨
