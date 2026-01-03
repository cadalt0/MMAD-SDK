# Periodic Permissions - Fixed Amount Per Period

## Overview

Periodic permissions allow a fixed amount to be transferred within a specific time period.

**Examples:**
- 100 USDC per day
- 0.1 ETH per week
- 1000 DAI per month

## ERC-20 Periodic Permission

### Minimal (Using Defaults)

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC Sepolia
  }
});

// Defaults:
// - amount: 1 USDC
// - periodDuration: 86400 seconds (1 day)
// - expiry: 1 week from now
// - decimals: 6
```

### With Custom Amount

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amount: '1000' // 1000 USDC per period
  }
});

// Other defaults still apply
```

### With Custom Period

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    amount: '500',
    periodDuration: 604800 // 1 week in seconds
  }
});

// 500 USDC per week
```

### Fully Customized

```typescript
const currentTime = Math.floor(Date.now() / 1000);

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenDecimals: 6,
    amount: '100.50',
    periodDuration: 86400, // 1 day
    expiry: currentTime + 2592000, // 30 days from now
    justification: 'Subscription payment for service X',
    isAdjustmentAllowed: true,
    startTime: currentTime // Can start in future
  }
});
```

## Native ETH Periodic Permission

### Minimal

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic'
  }
});

// Defaults:
// - amount: 0.00001 ETH
// - periodDuration: 86400 seconds (1 day)
// - expiry: 1 week from now
// - decimals: 18
```

### With Custom ETH Amount

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic',
    amount: '0.1' // 0.1 ETH per day
  }
});
```

### With Custom Period (Monthly)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic',
    amount: '1',
    periodDuration: 2592000 // ~30 days in seconds
  }
});

// 1 ETH per month
```

### With Start Time (Future Start)

```typescript
const currentTime = Math.floor(Date.now() / 1000);
const futureTime = currentTime + 86400; // 1 day from now

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic',
    amount: '0.5',
    startTime: futureTime // Permission starts in 1 day
  }
});
```

### All Options Combined

```typescript
const currentTime = Math.floor(Date.now() / 1000);

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic',
    tokenDecimals: 18,
    amount: '2.5',
    periodDuration: 604800, // 1 week
    expiry: currentTime + 7776000, // 90 days
    justification: 'DeFi protocol weekly allowance',
    isAdjustmentAllowed: false, // User cannot change
    startTime: currentTime + 86400 // Starts tomorrow
  }
});
```

## Different Token Examples

### USDC (6 decimals)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
    tokenDecimals: 6,
    amount: '100'
  }
});
```

### DAI (18 decimals)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x...',
    tokenDecimals: 18,
    amount: '1000'
  }
});
```

### USDT (6 decimals)

```typescript
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x...',
    tokenDecimals: 6,
    amount: '500'
  }
});
```

## Period Duration Examples

```typescript
// 1 hour
const oneHour = 3600;

// 1 day
const oneDay = 86400;

// 1 week
const oneWeek = 604800;

// 1 month (~30 days)
const oneMonth = 2592000;

// Custom: 12 hours
const twelveHours = 43200;
```

## Use Cases

### Daily Subscription

```typescript
await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0xUSDC',
    amount: '10',
    periodDuration: 86400, // per day
    expiry: Math.floor(Date.now() / 1000) + 31536000 // 1 year
  }
});
```

### Weekly Salary

```typescript
await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0xUSDC',
    amount: '2000',
    periodDuration: 604800, // per week
    expiry: Math.floor(Date.now() / 1000) + 31536000 // 1 year
  }
});
```

### Hourly Rate (DeFi Bot)

```typescript
await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'native-token-periodic',
    amount: '0.01',
    periodDuration: 3600, // per hour
    expiry: Math.floor(Date.now() / 1000) + 86400 // 1 day
  }
});
```

That's periodic permissions! Fixed amount, fixed period, every time.
