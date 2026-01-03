/**
 * Helper function to create permission presets
 * Fills in all defaults so users only specify what they need
 */

import { DEFAULT_PERMISSION_VALUES } from './defaults';
import type { AdvancedPermissionParams } from '../types/config';
import { InvalidPermissionConfigError } from '../errors';

export interface PermissionPresetInput {
  permissionType: 'erc20-token-periodic' | 'native-token-periodic';
  tokenAddress?: string; // REQUIRED for ERC-20, not used for native
  tokenDecimals?: number; // REQUIRED for ERC-20, default 18 for native
  amount?: string;
  periodDuration?: number;
  expiry?: number;
  justification?: string;
  chain?: any;
}

export function createPermissionPreset(input: PermissionPresetInput): AdvancedPermissionParams {
  const isErc20 = input.permissionType === 'erc20-token-periodic';
  const isNative = input.permissionType === 'native-token-periodic';

  // Validate required fields
  if (isErc20 && !input.tokenAddress) {
    throw new InvalidPermissionConfigError(
      'tokenAddress is required for erc20-token-periodic permissions'
    );
  }

  // Different default amounts for ERC-20 vs Native
  const defaultAmount = isNative ? '0.00001' : '1';

  return {
    permissionType: input.permissionType,
    tokenAddress: isErc20 ? input.tokenAddress : undefined,
    tokenDecimals: isErc20 
      ? input.tokenDecimals || 6 // Default to 6 for ERC-20 (USDC, USDT, etc)
      : input.tokenDecimals || 18, // 18 for ETH/native
    amount: input.amount || defaultAmount,
    periodDuration: input.periodDuration || DEFAULT_PERMISSION_VALUES.periodDuration,
    expiry: input.expiry || DEFAULT_PERMISSION_VALUES.getExpiry(),
    justification: input.justification || DEFAULT_PERMISSION_VALUES.justification,
    isAdjustmentAllowed: DEFAULT_PERMISSION_VALUES.isAdjustmentAllowed,
    chain: input.chain,
  };
}
