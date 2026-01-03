import type { Chain } from 'viem';
import type { PermissionType } from './permission';
import type { PermissionHooks } from './hooks';
import type { WalletClientWithPermissions } from '../providers/wallet-client';

export interface ProviderConfig {
  provider?: any; // Custom EIP-1193 provider
  wrapProvider?: (provider: any) => any; // Optional wrapper
}

// Periodic permission params (existing)
export interface PeriodicPermissionParams {
  permissionType: 'native-token-periodic' | 'erc20-token-periodic';
  tokenAddress?: string | null;
  tokenDecimals?: number;
  amount?: string; // human-readable value (e.g. "10")
  periodDuration?: number; // seconds
  expiry?: number; // unix seconds
  justification?: string;
  isAdjustmentAllowed?: boolean;
  startTime?: number;
  chain?: Chain;
}

// Stream permission params (new)
export interface StreamPermissionParams {
  permissionType: 'native-token-stream' | 'erc20-token-stream';
  tokenAddress?: string | null;
  tokenDecimals?: number;
  amountPerSecond?: string; // human-readable per second
  initialAmount?: string; // released at start
  maxAmount?: string; // maximum total
  startTime?: number; // when streaming starts
  expiry?: number; // unix seconds
  justification?: string;
  isAdjustmentAllowed?: boolean;
  chain?: Chain;
}

export type AdvancedPermissionParams = PeriodicPermissionParams | StreamPermissionParams;

export interface RequestAdvancedPermissionOptions {
  sessionAccountAddress: string;
  userAddress?: string;
  walletClient?: WalletClientWithPermissions;
  providerConfig?: ProviderConfig;
  permission: AdvancedPermissionParams;
  hooks?: PermissionHooks;
  transformRequest?: (request: any) => any; // Allow full override before send
}
