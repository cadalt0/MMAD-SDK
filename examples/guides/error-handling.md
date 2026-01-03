# Error Handling - Complete Guide

## Overview

Handle all errors gracefully with proper error classes and recovery strategies.

## Error Classes

```typescript
import {
  MissingBrowserProviderError,
  MissingRequestExecutionPermissionsError,
  UserRejectedError,
  InvalidPermissionConfigError
} from 'mmad-sdk';
```

## Basic Try-Catch

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

try {
  const result = await requestAdvancedPermission({
    sessionAccountAddress: '0x...',
    permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' }
  });
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

## Error Type Detection

```typescript
try {
  const result = await requestAdvancedPermission({...});
} catch (error) {
  if (error instanceof UserRejectedError) {
    console.log('User rejected the permission request');
  } else if (error instanceof InvalidPermissionConfigError) {
    console.log('Invalid config:', error.message);
  } else if (error instanceof MissingBrowserProviderError) {
    console.log('MetaMask not installed');
  } else if (error instanceof MissingRequestExecutionPermissionsError) {
    console.log('Browser does not support ERC-7715');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## User-Friendly Messages

```typescript
const getErrorMessage = (error: any): string => {
  if (error instanceof UserRejectedError) {
    return '❌ You cancelled the permission request';
  }
  if (error instanceof InvalidPermissionConfigError) {
    return `❌ Invalid configuration: ${error.message}`;
  }
  if (error instanceof MissingBrowserProviderError) {
    return '❌ Please install MetaMask to continue';
  }
  if (error instanceof MissingRequestExecutionPermissionsError) {
    return '❌ Your browser does not support advanced permissions. Please use MetaMask.';
  }
  if (error.message.includes('network')) {
    return '❌ Network error. Please check your connection.';
  }
  if (error.message.includes('timeout')) {
    return '❌ Request timeout. Please try again.';
  }
  return `❌ ${error.message || 'Unknown error occurred'}`;
};

try {
  const result = await requestAdvancedPermission({...});
} catch (error) {
  const message = getErrorMessage(error);
  alert(message);
}
```

## Error Logging

```typescript
const logError = async (error: any, context: string) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    type: error.constructor.name,
    stack: error.stack,
    code: error.code,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // Send to logging service
  await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  });
};

try {
  const result = await requestAdvancedPermission({...});
} catch (error) {
  await logError(error, 'permission_creation');
  throw error;
}
```

## Retry Logic

```typescript
const withRetry = async (fn, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry user rejection
      if (error instanceof UserRejectedError) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage
const result = await withRetry(
  () => requestAdvancedPermission({...}),
  3
);
```

## Fallback Strategies

```typescript
try {
  const result = await requestAdvancedPermission({...});
  return result;
} catch (error) {
  if (error instanceof MissingBrowserProviderError) {
    // Fallback: Show wallet connection guide
    return showWalletGuide();
  }
  
  if (error instanceof UserRejectedError) {
    // Fallback: Ask user to try again
    return retryWithDialog();
  }

  // General fallback
  return showErrorDialog(error);
}
```

## React Component Error Handling

```typescript
'use client';
import { useState } from 'react';
import { requestAdvancedPermission, UserRejectedError } from 'mmad-sdk';

export function PermissionComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await requestAdvancedPermission({
        sessionAccountAddress: '0x...',
        permission: {
          permissionType: 'erc20-token-periodic',
          tokenAddress: '0x...'
        }
      });

      setSuccess('✅ Permission granted!');
      console.log('Result:', result);

    } catch (err) {
      if (err instanceof UserRejectedError) {
        setError('You cancelled the request');
      } else {
        setError(err.message || 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button onClick={handleCreate} disabled={loading}>
        {loading ? 'Loading...' : 'Create Permission'}
      </button>
    </div>
  );
}
```

## Validation Errors

```typescript
const validateConfig = (config: any) => {
  const errors = [];

  if (!config.sessionAccountAddress) {
    errors.push('sessionAccountAddress is required');
  }

  if (!config.permission) {
    errors.push('permission is required');
  } else {
    if (!config.permission.permissionType) {
      errors.push('permission.permissionType is required');
    }

    if (config.permission.permissionType.includes('erc20')) {
      if (!config.permission.tokenAddress) {
        errors.push('permission.tokenAddress required for ERC-20');
      }
    }
  }

  if (errors.length > 0) {
    throw new InvalidPermissionConfigError(errors.join(', '));
  }
};

try {
  const result = await requestAdvancedPermission({
    sessionAccountAddress: '0x...',
    permission: {
      permissionType: 'erc20-token-periodic',
      tokenAddress: '0x...'
    }
  });
} catch (error) {
  if (error instanceof InvalidPermissionConfigError) {
    console.error('Config error:', error.message);
  }
}
```

## Network-Specific Error Handling

```typescript
try {
  const result = await requestAdvancedPermission({...});
} catch (error) {
  // Network errors
  if (error.message.includes('network')) {
    if (error.message.includes('wrong network')) {
      return switchNetwork('11155111'); // Switch to Sepolia
    }
    if (error.message.includes('offline')) {
      return showOfflineMessage();
    }
  }

  // RPC errors
  if (error.code === -32600) {
    console.error('Invalid request');
  }
  if (error.code === -32601) {
    console.error('Method not found');
  }
  if (error.code === -32603) {
    console.error('Internal RPC error - retry');
  }

  throw error;
}
```

## Timeout Handling

```typescript
const withTimeout = (promise, ms = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    )
  ]);
};

try {
  const result = await withTimeout(
    requestAdvancedPermission({...}),
    30000 // 30 second timeout
  );
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Request took too long, try again');
  }
}
```

## Error Recovery Hooks

```typescript
const hooks = {
  onError: async (error) => {
    // Log error
    console.error('Permission creation failed:', error);

    // Notify user
    showToast(`❌ ${error.message}`, 'error');

    // Send to monitoring service
    await monitoringService.reportError({
      error,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    });

    // Cleanup
    localStorage.removeItem('pending_permission');

    // Suggest action
    if (error instanceof MissingBrowserProviderError) {
      showInstallMetaMaskDialog();
    } else if (error instanceof UserRejectedError) {
      showRetryPrompt();
    }
  }
};

await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: { permissionType: 'erc20-token-periodic', tokenAddress: '0x...' },
  hooks
});
```

## Global Error Handler

```typescript
// Set up global error handler
window.addEventListener('error', (event) => {
  if (event.error instanceof UserRejectedError) {
    console.log('User rejected permission request globally');
  }
});

// Handle promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof InvalidPermissionConfigError) {
    console.error('Invalid config:', event.reason.message);
    event.preventDefault(); // Prevent crash
  }
});
```

## Testing Error Scenarios

```typescript
// Test missing provider
expect(
  () => requestAdvancedPermission({...})
).rejects.toThrow(MissingBrowserProviderError);

// Test invalid config
expect(
  () => requestAdvancedPermission({
    sessionAccountAddress: '0x...',
    permission: {} // Missing permissionType
  })
).rejects.toThrow(InvalidPermissionConfigError);

// Test user rejection
mockMetaMask.reject();
expect(
  () => requestAdvancedPermission({...})
).rejects.toThrow(UserRejectedError);
```

Error handling = happy users! 😊
