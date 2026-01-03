/**
 * MetaMask Advanced Permissions SDK
 * Main entry point - exports all public APIs
 */

// Core
export { requestAdvancedPermission, redeemPermission } from './core';
export type { AdvancedPermissionParams, RequestAdvancedPermissionOptions, ProviderConfig } from './types';
export type { RedeemPermissionOptions } from './core/redeem';

// Providers
export { createWalletClientWithPermissions, resolveProvider } from './providers';
export type { WalletClientWithPermissions } from './providers';

// Types
export type { PermissionHooks } from './types';
export type { PermissionType } from './types';
export type { RedeemHooks, RedeemResult } from './types';

// Errors
export {
  MissingBrowserProviderError,
  MissingRequestExecutionPermissionsError,
  UserRejectedError,
  InvalidPermissionConfigError,
} from './errors';

// Utils & Presets
export { wrapEthereumProvider, createSessionAccountFromAddress, createPermissionPreset } from './utils';
export { DEFAULT_PERMISSION_VALUES, DEFAULT_REDEEM_VALUES, SUPPORTED_CHAINS, SUPPORTED_CHAIN_IDS, isSupportedChain, getChainById } from './utils';
