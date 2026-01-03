import { parseUnits } from 'viem';
import { sepolia as defaultChain } from 'viem/chains';
import { createSessionAccountFromAddress } from '../utils/session-account';
import { createWalletClientWithPermissions } from '../providers/wallet-client';
import { InvalidPermissionConfigError, UserRejectedError } from '../errors';
import { DEFAULT_PERMISSION_VALUES } from '../utils/defaults';
import { isSupportedChain } from '../utils/supported-chains';
import type { RequestAdvancedPermissionOptions, AdvancedPermissionParams } from '../types/config';
import type { PermissionHooks } from '../types/hooks';

function applyDefaults(params: Partial<AdvancedPermissionParams>): AdvancedPermissionParams {
  if (!params.permissionType) {
    throw new InvalidPermissionConfigError('permissionType is required');
  }
  
  const isNative = params.permissionType.includes('native');
  const isPeriodic = params.permissionType.includes('periodic');
  const isStream = params.permissionType.includes('stream');
  const defaultAmount = isNative ? '0.00001' : '1';

  const p = params as any;

  const base = {
    permissionType: params.permissionType,
    tokenAddress: params.tokenAddress,
    tokenDecimals: params.tokenDecimals ?? (isNative ? 18 : 6),
    expiry: params.expiry || DEFAULT_PERMISSION_VALUES.getExpiry(),
    justification: params.justification || DEFAULT_PERMISSION_VALUES.justification,
    isAdjustmentAllowed: params.isAdjustmentAllowed ?? DEFAULT_PERMISSION_VALUES.isAdjustmentAllowed,
    chain: params.chain,
  };

  if (isPeriodic) {
    return {
      ...base,
      amount: p.amount || defaultAmount,
      periodDuration: p.periodDuration || DEFAULT_PERMISSION_VALUES.periodDuration,
      startTime: p.startTime,
    } as any;
  }

  if (isStream) {
    return {
      ...base,
      amountPerSecond: p.amountPerSecond || DEFAULT_PERMISSION_VALUES.amountPerSecond,
      initialAmount: p.initialAmount || DEFAULT_PERMISSION_VALUES.initialAmount,
      maxAmount: p.maxAmount || DEFAULT_PERMISSION_VALUES.maxAmount,
      startTime: p.startTime || DEFAULT_PERMISSION_VALUES.getStartTime(),
    } as any;
  }

  throw new InvalidPermissionConfigError(`Unknown permission type: ${params.permissionType}`);
}

function ensureConfig(params: AdvancedPermissionParams) {
  const isErc20 = params.permissionType.includes('erc20');
  const isPeriodic = params.permissionType.includes('periodic');
  const isStream = params.permissionType.includes('stream');

  if (isErc20 && !params.tokenAddress) {
    throw new InvalidPermissionConfigError('tokenAddress is required for ERC-20 permissions');
  }
  if (!params.tokenDecimals && params.tokenDecimals !== 0) {
    throw new InvalidPermissionConfigError('tokenDecimals is required');
  }

  // Validate periodic-specific fields
  if (isPeriodic) {
    const periodicParams = params as any;
    if (!periodicParams.amount || Number(periodicParams.amount) <= 0) {
      throw new InvalidPermissionConfigError('amount must be greater than zero');
    }
    if (!periodicParams.periodDuration) {
      throw new InvalidPermissionConfigError('periodDuration is required');
    }
  }

  // Validate stream-specific fields
  if (isStream) {
    const streamParams = params as any;
    if (!streamParams.amountPerSecond || Number(streamParams.amountPerSecond) <= 0) {
      throw new InvalidPermissionConfigError('amountPerSecond must be greater than zero');
    }
    if (!streamParams.initialAmount || Number(streamParams.initialAmount) < 0) {
      throw new InvalidPermissionConfigError('initialAmount must be zero or greater');
    }
    if (!streamParams.maxAmount || Number(streamParams.maxAmount) <= 0) {
      throw new InvalidPermissionConfigError('maxAmount must be greater than zero');
    }
    if (!streamParams.startTime) {
      throw new InvalidPermissionConfigError('startTime is required for stream permissions');
    }
  }

  if (!params.expiry) {
    throw new InvalidPermissionConfigError('expiry is required');
  }

  // Validate chain is supported
  const chain = params.chain || defaultChain;
  if (!isSupportedChain(chain.id)) {
    throw new InvalidPermissionConfigError(
      `Chain ${chain.name} (id: ${chain.id}) is not supported for ERC-7715 Advanced Permissions. ` +
      `Supported chains: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Gnosis, and their testnets.`
    );
  }
}

function applyHook<T>(hook: PermissionHooks[keyof PermissionHooks] | undefined, payload: T): Promise<T> {
  if (!hook) return Promise.resolve(payload);
  return Promise.resolve((hook as any)(payload)).then((result) => result ?? payload);
}

function buildBaseRequest(params: AdvancedPermissionParams, sessionAccountAddress: string) {
  const chain = params.chain || defaultChain;
  const isPeriodic = params.permissionType.includes('periodic');
  const isStream = params.permissionType.includes('stream');

  const request: any = {
    chainId: chain.id,
    expiry: params.expiry,
    signer: {
      type: 'account',
      data: { address: sessionAccountAddress },
    },
    permission: {
      type: params.permissionType,
      data: {
        tokenAddress: params.tokenAddress ?? undefined,
        justification: params.justification,
      },
    },
    isAdjustmentAllowed: params.isAdjustmentAllowed ?? true,
  };

  // Add periodic-specific fields
  if (isPeriodic) {
    const periodicParams = params as any;
    const decimals = params.tokenDecimals ?? (params.permissionType.includes('native') ? 18 : 6);
    const periodAmount = parseUnits(periodicParams.amount, decimals);
    request.permission.data.periodAmount = periodAmount;
    request.permission.data.periodDuration = periodicParams.periodDuration;
    
    if (periodicParams.startTime) {
      request.permission.data.startTime = periodicParams.startTime;
    }
  }

  // Add stream-specific fields
  if (isStream) {
    const streamParams = params as any;
    const decimals = params.tokenDecimals ?? (params.permissionType.includes('native') ? 18 : 6);
    const amountPerSecond = parseUnits(streamParams.amountPerSecond, decimals);
    const initialAmount = parseUnits(streamParams.initialAmount, decimals);
    const maxAmount = parseUnits(streamParams.maxAmount, decimals);
    
    request.permission.data.amountPerSecond = amountPerSecond;
    request.permission.data.initialAmount = initialAmount;
    request.permission.data.maxAmount = maxAmount;
    request.permission.data.startTime = streamParams.startTime;
  }

  return request;
}

export async function requestAdvancedPermission(options: RequestAdvancedPermissionOptions) {
  // Validate options
  if (!options || !options.permission) {
    throw new InvalidPermissionConfigError('options.permission is required');
  }
  
  // Apply defaults to permission params
  const permissionWithDefaults = applyDefaults(options.permission);
  ensureConfig(permissionWithDefaults);

  const hooks = options.hooks || {};
  const walletClient = options.walletClient ?? createWalletClientWithPermissions(options.providerConfig);

  // Resolve user address (connects if needed)
  const addresses = options.userAddress ? [options.userAddress] : await walletClient.requestAddresses();
  const userAddress = addresses[0];
  if (!userAddress) {
    throw new InvalidPermissionConfigError('No connected account found.');
  }

  const sessionAccount = createSessionAccountFromAddress(options.sessionAccountAddress);
  let request = buildBaseRequest(permissionWithDefaults, sessionAccount.address);

  request = await applyHook(hooks.beforeBuild, request);
  request = options.transformRequest ? options.transformRequest(request) : request;
  request = await applyHook(hooks.beforeRequest, request);

  try {
    const response = await walletClient.requestExecutionPermissions?.([request]);
    const granted = response?.[0];
    await hooks.afterRequest?.(granted);

    return {
      permissionContext: (granted as any)?.permissionsContext ?? (granted as any)?.context,
      delegationManager: (granted as any)?.signerMeta?.delegationManager,
      request,
      response: granted,
      userAddress,
      sessionAccount,
    };
  } catch (error: any) {
    if (error?.code === 4001) {
      const wrapped = new UserRejectedError('User rejected the permission request.');
      await hooks.onError?.(wrapped);
      throw wrapped;
    }
    await hooks.onError?.(error);
    throw error;
  }
}
