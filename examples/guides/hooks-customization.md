# Hooks Customization - Lifecycle Control

## Overview

Hooks let you intercept and customize every step of permission creation and redemption.

## Permission Hooks

```typescript
import { requestAdvancedPermission } from 'mmad-sdk';

const result = await requestAdvancedPermission({
  sessionAccountAddress: '0x...',
  permission: {
    permissionType: 'erc20-token-periodic',
    tokenAddress: '0x...'
  },
  hooks: {
    // Called before building the request
    beforeBuild: (req) => {
      console.log('Before build:', req);
      return req; // Can modify!
    },

    // Called before sending to wallet
    beforeRequest: (req) => {
      console.log('Before request:', req);
      return req; // Can modify!
    },

    // Called after wallet approves
    afterRequest: (response) => {
      console.log('After request:', response);
      // No need to return
    },

    // Called on any error
    onError: (error) => {
      console.error('Error occurred:', error);
    }
  }
});
```

## Redeem Hooks

```typescript
import { redeemPermission } from 'mmad-sdk';

const result = await redeemPermission({
  permissionsContext: perm,
  recipient: '0x...',
  amount: '10',
  permissionType: 'erc20-token-periodic',
  tokenAddress: '0x...',
  tokenDecimals: 6,
  hooks: {
    beforeBuild: (req) => req,
    beforeRequest: (req) => req,
    afterRequest: (response) => {},
    onError: (error) => {}
  }
});
```

## Example: Logging

```typescript
hooks: {
  beforeBuild: (req) => {
    console.log('📋 Building permission request');
    return req;
  },
  beforeRequest: (req) => {
    console.log('📤 Sending to MetaMask');
    console.log('Request:', req);
    return req;
  },
  afterRequest: (response) => {
    console.log('✅ MetaMask approved!');
    console.log('Response:', response);
  },
  onError: (error) => {
    console.error('❌ Error:', error.message);
  }
}
```

## Example: Validation

```typescript
hooks: {
  beforeBuild: (req) => {
    // Validate before building
    if (!req.permissionType) {
      throw new Error('Permission type required');
    }
    return req;
  },
  beforeRequest: (req) => {
    // Final validation before sending
    if (req.chainId !== 11155111) {
      throw new Error('Only Sepolia supported');
    }
    return req;
  },
  onError: (error) => {
    if (error.message.includes('User rejected')) {
      console.log('User said no :(');
    }
  }
}
```

## Example: Modification

```typescript
hooks: {
  beforeBuild: (req) => {
    // Add custom justification
    return {
      ...req,
      justification: `Created at ${new Date().toISOString()}`
    };
  },
  beforeRequest: (req) => {
    // Modify amounts
    return {
      ...req,
      amount: String(parseFloat(req.amount) * 2) // Double the amount
    };
  }
}
```

## Example: Analytics Tracking

```typescript
hooks: {
  beforeBuild: (req) => {
    analytics.track('permission_build_started', {
      timestamp: new Date(),
      permissionType: req.permissionType,
      tokenAddress: req.tokenAddress
    });
    return req;
  },
  afterRequest: (response) => {
    analytics.track('permission_approved', {
      permissionContext: response.permissionContext,
      timestamp: new Date()
    });
  },
  onError: (error) => {
    analytics.track('permission_error', {
      error: error.message,
      timestamp: new Date()
    });
  }
}
```

## Example: User Notifications

```typescript
hooks: {
  beforeBuild: (req) => {
    showToast('Preparing permission request...', 'info');
    return req;
  },
  beforeRequest: (req) => {
    showToast('Please approve in MetaMask', 'warning');
    return req;
  },
  afterRequest: (response) => {
    showToast('✅ Permission granted!', 'success');
  },
  onError: (error) => {
    showToast(`❌ ${error.message}`, 'error');
  }
}
```

## Example: State Management (Redux)

```typescript
const dispatch = useDispatch();

const hooks = {
  beforeBuild: (req) => {
    dispatch(setPermissionLoading(true));
    dispatch(setPermissionStatus('building'));
    return req;
  },
  beforeRequest: (req) => {
    dispatch(setPermissionStatus('requesting'));
    return req;
  },
  afterRequest: (response) => {
    dispatch(setPermissionLoading(false));
    dispatch(setPermissionStatus('success'));
    dispatch(setPermissionContext(response.permissionContext));
  },
  onError: (error) => {
    dispatch(setPermissionLoading(false));
    dispatch(setPermissionStatus('error'));
    dispatch(setPermissionError(error.message));
  }
};
```

## Example: State Management (Zustand)

```typescript
import { useStore } from '@/store';

const hooks = {
  beforeBuild: (req) => {
    useStore.setState({ loading: true, status: 'building' });
    return req;
  },
  beforeRequest: (req) => {
    useStore.setState({ status: 'requesting' });
    return req;
  },
  afterRequest: (response) => {
    useStore.setState({
      loading: false,
      status: 'success',
      permissionContext: response.permissionContext
    });
  },
  onError: (error) => {
    useStore.setState({
      loading: false,
      status: 'error',
      error: error.message
    });
  }
};
```

## Example: Local Storage

```typescript
hooks: {
  beforeBuild: (req) => {
    localStorage.setItem('pending_permission', JSON.stringify(req));
    return req;
  },
  afterRequest: (response) => {
    localStorage.setItem('approved_permission', JSON.stringify(response));
    localStorage.removeItem('pending_permission');
  },
  onError: (error) => {
    localStorage.setItem('last_error', error.message);
  }
}
```

## Example: Async Operations

```typescript
hooks: {
  beforeBuild: async (req) => {
    // Fetch additional data
    const userData = await fetchUser();
    return {
      ...req,
      userId: userData.id
    };
  },
  afterRequest: async (response) => {
    // Save to backend
    await api.savePermission({
      permissionContext: response.permissionContext,
      userAddress: response.userAddress
    });
  },
  onError: async (error) => {
    // Report error to logging service
    await logService.error({
      message: error.message,
      stack: error.stack
    });
  }
}
```

## Example: Rate Limiting (Client-Side)

```typescript
import { throttle } from 'lodash';

const createPermissions = throttle(async (config) => {
  return await requestAdvancedPermission(config);
}, 5000); // Max 1 request per 5 seconds

const hooks = {
  beforeRequest: (req) => {
    const lastRequest = localStorage.getItem('last_permission_request');
    const now = Date.now();
    
    if (lastRequest && now - parseInt(lastRequest) < 5000) {
      throw new Error('Please wait before creating another permission');
    }
    
    localStorage.setItem('last_permission_request', String(now));
    return req;
  }
}
```

## Example: Timeout Handling

```typescript
const withTimeout = (fn, ms = 30000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Operation timeout')),
      ms
    );
    
    return fn()
      .then(result => {
        clearTimeout(timer);
        return result;
      })
      .catch(err => {
        clearTimeout(timer);
        throw err;
      });
  });
};

const hooks = {
  beforeRequest: async (req) => {
    // Enforce 30 second timeout
    return await withTimeout(
      () => Promise.resolve(req),
      30000
    );
  }
};
```

## Example: Debugging

```typescript
hooks: {
  beforeBuild: (req) => {
    console.group('📋 Before Build');
    console.log('Permission Type:', req.permissionType);
    console.log('Amount:', req.amount);
    console.log('Full Request:', req);
    console.groupEnd();
    return req;
  },
  beforeRequest: (req) => {
    console.group('📤 Before Request');
    console.table(req);
    console.groupEnd();
    return req;
  },
  afterRequest: (response) => {
    console.group('✅ After Request');
    console.log('Permission Context:', response.permissionContext);
    console.log('Full Response:', response);
    console.groupEnd();
  },
  onError: (error) => {
    console.group('❌ Error');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full Error:', error);
    console.groupEnd();
  }
}
```

## Complete Hook Example

```typescript
const hooks = {
  beforeBuild: (req) => {
    const timestamp = new Date();
    console.log(`[${timestamp}] Building...`);
    return {
      ...req,
      createdAt: timestamp
    };
  },

  beforeRequest: (req) => {
    console.log('Final request:', req);
    
    // Validate
    if (!req.sessionAccountAddress) {
      throw new Error('Session account required');
    }
    
    // Notify user
    showToast('Pending your approval...', 'info');
    
    return req;
  },

  afterRequest: (response) => {
    console.log('✅ Approved:', response.permissionContext);
    showToast('✅ Permission granted!', 'success');
    
    // Save
    saveToDatabase({
      context: response.permissionContext,
      timestamp: new Date(),
      address: response.userAddress
    });
  },

  onError: (error) => {
    console.error('❌ Failed:', error);
    showToast(`❌ ${error.message}`, 'error');
    
    // Log error
    logService.error({
      message: error.message,
      type: error.constructor.name
    });
  }
};
```

Hooks = total control over the flow! 🎮
