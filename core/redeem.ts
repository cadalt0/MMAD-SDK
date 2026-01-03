/**
 * Redeem permission - main SDK function
 * Redeems a permission to execute token transfers
 * 
 * Supports:
 * - Native ETH periodic transfers
 * - ERC-20 token periodic transfers
 * - Full customization via hooks
 * - Custom execution logic
 * - Custom backend submission
 * 
 * Note: delegationManager is extracted from permissionsContext automatically
 */

import { InvalidPermissionConfigError, UserRejectedError } from '../errors';
import type { RedeemHooks, PermissionType, RedeemResult } from '../types/redeem';
import { DEFAULT_REDEEM_VALUES } from '../utils/redeem-defaults';
import { isSupportedChain } from '../utils/supported-chains';

export interface RedeemPermissionOptions {
  // Permission context from creation (contains delegation manager)
  permissionsContext: string;
  
  // Redemption details
  recipient: string;
  amount: string;
  permissionType: PermissionType;
  
  // Optional for ERC-20
  tokenAddress?: string;
  tokenDecimals?: number;
  
  // Optional chain (for validation)
  chainId?: number;
  
  // Optional session account (for backend verification)
  sessionAccountAddress?: string;
  
  // Customization
  hooks?: RedeemHooks;
  
  // Backend endpoint for redemption
  backendEndpoint?: string; // Default: '/api/redeem'
  
  // Custom submission function (overrides backend call)
  customRedeem?: (options: any) => Promise<RedeemResult>;
}

function ensureRedeemConfig(options: RedeemPermissionOptions) {
  if (!options) {
    throw new InvalidPermissionConfigError('options is required');
  }
  if (!options.permissionsContext) {
    throw new InvalidPermissionConfigError('permissionsContext is required');
  }
  if (!options.recipient || !options.recipient.startsWith('0x')) {
    throw new InvalidPermissionConfigError('recipient must be a valid Ethereum address');
  }
  if (!options.amount || Number(options.amount) <= 0) {
    throw new InvalidPermissionConfigError('amount must be greater than zero');
  }
  if (!options.permissionType) {
    throw new InvalidPermissionConfigError('permissionType is required');
  }

  // Validate ERC-20 specific requirements
  if (options.permissionType === 'erc20-token-periodic') {
    if (!options.tokenAddress) {
      throw new InvalidPermissionConfigError('tokenAddress is required for erc20-token-periodic');
    }
    if (options.tokenDecimals === undefined) {
      throw new InvalidPermissionConfigError('tokenDecimals is required for erc20-token-periodic');
    }
  }

  // Validate chain if provided
  if (options.chainId && !isSupportedChain(options.chainId)) {
    throw new InvalidPermissionConfigError(
      `Chain ID ${options.chainId} is not supported for ERC-7715 Advanced Permissions`
    );
  }
}

async function applyHook<T>(
  hook: RedeemHooks[keyof RedeemHooks] | undefined,
  payload: T
): Promise<T> {
  if (!hook) return Promise.resolve(payload);
  return Promise.resolve((hook as any)(payload)).then((result) => result ?? payload);
}

export async function redeemPermission(options: RedeemPermissionOptions): Promise<RedeemResult> {
  ensureRedeemConfig(options);

  const hooks = options.hooks || {};

  try {
    // Build redeem request
    let request: any = {
      permissionsContext: options.permissionsContext,
      recipient: options.recipient,
      amount: options.amount,
      permissionType: options.permissionType,
    };

    // Only add optional fields if provided
    if (options.tokenAddress) request.tokenAddress = options.tokenAddress;
    if (options.tokenDecimals !== undefined) request.tokenDecimals = options.tokenDecimals;
    if (options.sessionAccountAddress) request.sessionAccountAddress = options.sessionAccountAddress;
    if (options.chainId) request.chainId = options.chainId;

    request = await applyHook(hooks.beforeBuild, request);
    request = await applyHook(hooks.beforeRequest, request);

    // Use custom redeem function if provided
    if (options.customRedeem) {
      const result = await options.customRedeem(options);
      await hooks.afterRequest?.(result);
      return result;
    }

    // Default: if backend endpoint provided, submit to it
    if (options.backendEndpoint) {
      const response = await fetch(options.backendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to redeem permission';
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || error.details || errorMsg;
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const result: RedeemResult = await response.json();
      await hooks.afterRequest?.(result);
      return result;
    }

    // Default: just return the request, user can do what they want with it
    const result: RedeemResult = {
      success: true,
      redeemRequest: request,
      message: 'Redeem request prepared. Use customRedeem or backendEndpoint to submit.',
    };
    await hooks.afterRequest?.(result);

    return result;
  } catch (error: any) {
    if (error?.code === 4001) {
      const wrapped = new UserRejectedError('User rejected the redemption.');
      await hooks.onError?.(wrapped);
      throw wrapped;
    }
    await hooks.onError?.(error);
    throw error;
  }
}
