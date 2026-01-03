# Redeem with Backend - Submit to API

## Overview

Use a backend API to execute redemptions server-side. The session key stays on your backend, never exposed to frontend.

## Basic Backend Redeem

### Frontend Code

```typescript
import { autoRedeem } from 'mmad-sdk';

const result = await autoRedeem({
  permissionsContext: previousPermissionResult,
  recipient: '0x...',
  amount: '10',
  // Default: posts to /api/redeem
});
```

### Backend API Route (Next.js)

```typescript
// app/api/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      permissionsContext,
      recipient,
      amount,
      permissionType,
      tokenAddress,
      tokenDecimals
    } = body;

    // 1. Validate request
    if (!permissionsContext || !recipient || !amount || !permissionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Get delegation manager from permissionsContext
    const delegationManager = permissionsContext.delegationManager;
    if (!delegationManager) {
      return NextResponse.json(
        { error: 'Invalid permissionsContext' },
        { status: 400 }
      );
    }

    // 3. Get session key from environment
    const sessionPrivateKey = process.env.SESSION_PRIVATE_KEY;
    if (!sessionPrivateKey) {
      return NextResponse.json(
        { error: 'Session key not configured' },
        { status: 500 }
      );
    }

    // 4. Execute transaction (your logic here)
    // Using viem or ethers.js to sign with session key and submit

    // 5. Return result
    return NextResponse.json({
      success: true,
      message: 'Redemption executed',
      delegationManager,
      recipient,
      amount,
      transactionHash: '0x...'
    });

  } catch (error: any) {
    console.error('Redeem error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem' },
      { status: 500 }
    );
  }
}
```

## Backend with Database Logging

### Store Redemption History

```typescript
// app/api/redeem/route.ts
import { db } from '@/lib/database'; // Your database

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id'); // From auth

    // Validate
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permissionsContext, recipient, amount, permissionType } = body;

    // Log to database
    const redemption = await db.redemptions.create({
      userId,
      permissionsContext: JSON.stringify(permissionsContext),
      recipient,
      amount,
      permissionType,
      status: 'pending',
      createdAt: new Date()
    });

    // Execute transaction
    const txHash = await executeRedemption(body);

    // Update status
    await db.redemptions.update(redemption.id, {
      status: 'success',
      transactionHash: txHash
    });

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      redemptionId: redemption.id
    });

  } catch (error: any) {
    // Log failed redemption
    await db.redemptions.create({
      status: 'failed',
      error: error.message
    });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Backend with Rate Limiting

### Prevent Spam

```typescript
// app/api/redeem/route.ts
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  windowMs: 60000,      // 1 minute
  maxRequests: 10       // Max 10 requests per minute
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  // Check rate limit
  const allowed = await limiter.check(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  const body = await request.json();
  // ... rest of logic
}
```

## Backend with Validation

### Validate Amounts and Permissions

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, permissionType, tokenAddress } = body;

    // 1. Validate amount
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > 10000) {
      return NextResponse.json(
        { error: 'Amount out of allowed range' },
        { status: 400 }
      );
    }

    // 2. Validate permission type
    const validTypes = [
      'erc20-token-periodic',
      'native-token-periodic',
      'erc20-token-stream',
      'native-token-stream'
    ];
    if (!validTypes.includes(permissionType)) {
      return NextResponse.json(
        { error: 'Invalid permission type' },
        { status: 400 }
      );
    }

    // 3. Validate token for ERC-20
    if (permissionType.includes('erc20')) {
      if (!tokenAddress || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return NextResponse.json(
          { error: 'Invalid token address' },
          { status: 400 }
        );
      }
    }

    // 4. Check user has permission to redeem
    const hasPermission = await checkUserPermission(userId, body);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // ... execute redemption
  } catch (error) {
    // ...
  }
}
```

## Backend with Multiple Chains

### Support Different Networks

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainId = 11155111 } = body; // Default to Sepolia

    // Map chain to RPC
    const rpcUrls: Record<number, string> = {
      1: process.env.ETHEREUM_RPC,
      11155111: process.env.SEPOLIA_RPC,
      137: process.env.POLYGON_RPC,
      80002: process.env.POLYGON_AMOY_RPC,
      // ... more chains
    };

    const rpcUrl = rpcUrls[chainId];
    if (!rpcUrl) {
      return NextResponse.json(
        { error: `Chain ${chainId} not supported` },
        { status: 400 }
      );
    }

    // Execute on correct network
    const client = createPublicClient({
      chain: getChainById(chainId),
      transport: http(rpcUrl)
    });

    // ... rest of logic
  } catch (error) {
    // ...
  }
}
```

## Backend with Async Processing

### Queue Redemptions for Later

```typescript
import { Queue } from 'bullmq';

const redemptionQueue = new Queue('redemptions');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Add to queue immediately
    const job = await redemptionQueue.add(
      'redeem',
      body,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true
      }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Redemption queued for processing'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Worker process
redemptionQueue.process(async (job) => {
  try {
    const result = await executeRedemption(job.data);
    return { success: true, ...result };
  } catch (error) {
    throw error; // Will retry
  }
});
```

## Frontend Usage Patterns

### Simple Call

```typescript
const result = await redeemPermission({
  permissionsContext: perm,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x...',
  tokenDecimals: 6,
  backendEndpoint: '/api/redeem'
});
```

### With Error Handling

```typescript
try {
  const result = await redeemPermission({
    permissionsContext: perm,
    recipient: '0x...',
    amount: '10',
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x...',
    tokenDecimals: 6,
    backendEndpoint: '/api/redeem'
  });
  
  if (result.success) {
    console.log('Redeemed! TX:', result.transactionHash);
  }
} catch (error) {
  if (error.message.includes('rate limit')) {
    alert('Too many requests. Please wait a moment.');
  } else {
    alert('Redemption failed: ' + error.message);
  }
}
```

### With Loading State

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleRedeem = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await redeemPermission({...});
    // Show success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

Backend redemptions = secure, flexible, full control! 🔒
