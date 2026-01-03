# Basic Usage - The 2-3 Line Way

## Create Permission (Minimum Code)

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

// That's it! Uses all defaults
const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x1234567890123456789012345678901234567890',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' }
});

console.log('Permission granted!', result.permissionContext);
```

**Defaults applied automatically:**
- Amount: 1 USDC
- Period: 1 day (86400 seconds)
- Expiry: 1 week from now
- Decimals: 6 (for ERC-20)
- Adjustment allowed: Yes

## Redeem Permission (Minimum Code)

```typescript
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: previousPermissionResult,
  recipient: '0x9876543210987654321098765432109876543210',
  amount: '0.5',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  tokenDecimals: 6
});

console.log('Redeemed!', result);
```

## What You Get Back

### Create Response

```typescript
{
  permissionContext: "0x...", // Main result - pass to redeem
  delegationManager: "0x...",
  request: { /* EIP-712 request */ },
  response: { /* MetaMask response */ },
  userAddress: "0x...",       // User who signed
  sessionAccount: { /* account */ }
}
```

### Redeem Response (with backendEndpoint)

```typescript
{
  success: true,
  message: "Permission redeem request submitted",
  delegationManager: "0x...",
  recipient: "0x...",
  amount: "0.5",
  // When backend executes:
  transactionHash: "0x..."
}
```

## React Component Usage

```typescript
'use client';
import { useState } from 'react';
import { requestAdvancedPermission, redeemPermission } from 'mmad-sdk';

export function PermissionFlow() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await requestAdvancedPermission({
        sessionAccountAddress: '0x...',
        permission: {
          permissionType: 'erc20-token-periodic',
          tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
        }
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    setLoading(true);
    try {
      await redeemPermission({
        permissionsContext: result,
        recipient: '0x...',
        amount: '0.5',
        permissionType: 'erc20-token-periodic',
        tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        tokenDecimals: 6,
        backendEndpoint: '/api/redeem'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleCreate} disabled={loading}>
        Create Permission
      </button>
      {result && (
        <button onClick={handleRedeem} disabled={loading}>
          Redeem Permission
        </button>
      )}
    </>
  );
}
```

## Next.js API Route Example

```typescript
// app/api/redeem/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // body has: permissionsContext, recipient, amount, permissionType, tokenAddress, tokenDecimals
  
  // Your redemption logic here
  // 1. Validate request
  // 2. Execute transaction (user backend)
  // 3. Return tx hash
  
  return Response.json({
    success: true,
    transactionHash: '0x...'
  });
}
```

That's it! 2-3 lines of code, magic happens automatically.
