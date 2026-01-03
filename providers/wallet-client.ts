import { createWalletClient, custom } from 'viem';
import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import { wrapEthereumProvider } from '../utils/wrap-ethereum';
import { MissingBrowserProviderError, MissingRequestExecutionPermissionsError } from '../errors';
import type { ProviderConfig } from '../types/config';

export type WalletClientWithPermissions = ReturnType<typeof createWalletClient> & {
  requestExecutionPermissions?: (requests: any[]) => Promise<any[]>;
  requestAddresses?: () => Promise<string[]>;
};

export function resolveProvider(config?: ProviderConfig) {
  if (config?.provider) return config.provider;
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  throw new MissingBrowserProviderError();
}

export function createWalletClientWithPermissions(config?: ProviderConfig): WalletClientWithPermissions {
  const provider = resolveProvider(config);
  const wrapped = config?.wrapProvider ? config.wrapProvider(provider) : wrapEthereumProvider(provider);

  const walletClient = createWalletClient({
    transport: custom(wrapped),
  }).extend(erc7715ProviderActions()) as WalletClientWithPermissions;

  if (typeof walletClient.requestExecutionPermissions !== 'function') {
    throw new MissingRequestExecutionPermissionsError();
  }

  return walletClient;
}
