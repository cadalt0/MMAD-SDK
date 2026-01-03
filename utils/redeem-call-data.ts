import { encodeFunctionData, parseUnits, zeroAddress } from 'viem';
import { InvalidPermissionConfigError } from '../errors';
import type { RedeemPermissionOptions } from '../core/redeem';

// Minimal ABI for a generic redeem entrypoint.
// Adjust if your DelegationManager uses a different signature.
const DEFAULT_REDEEM_ABI = [
  {
    type: 'function',
    name: 'redeemPermission',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'permissionsContext', type: 'bytes' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'permissionType', type: 'string' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'tokenDecimals', type: 'uint8' },
    ],
    outputs: [],
  },
] as const;

export interface BuildRedeemCallDataOptions extends RedeemPermissionOptions {
  delegationManager: string; // target contract address
  valueWei?: bigint; // native value to send (for native permissions)
  abi?: typeof DEFAULT_REDEEM_ABI; // custom ABI override
}

export interface BuiltRedeemCallData {
  to: string;
  data: `0x${string}`;
  value: bigint;
}

export function buildRedeemCallData(options: BuildRedeemCallDataOptions): BuiltRedeemCallData {
  if (!options.delegationManager || !options.delegationManager.startsWith('0x')) {
    throw new InvalidPermissionConfigError('delegationManager address is required to build call data');
  }

  const isErc20 = options.permissionType === 'erc20-token-periodic';
  const tokenDecimals = isErc20 ? options.tokenDecimals ?? 6 : 18;
  const tokenAddress = isErc20 ? options.tokenAddress || zeroAddress : zeroAddress;

  if (isErc20 && !options.tokenAddress) {
    throw new InvalidPermissionConfigError('tokenAddress is required to build ERC-20 redeem call data');
  }

  const amountParsed = parseUnits(options.amount, tokenDecimals);

  const recipient = options.recipient as `0x${string}`;
  const tokenAddr = tokenAddress as `0x${string}`;
  const permissionsContext = options.permissionsContext as `0x${string}`;

  const data = encodeFunctionData({
    abi: options.abi || DEFAULT_REDEEM_ABI,
    functionName: 'redeemPermission',
    args: [
      permissionsContext,
      recipient,
      amountParsed,
      options.permissionType,
      tokenAddr,
      tokenDecimals,
    ],
  });

  return {
    to: options.delegationManager,
    data,
    value: options.valueWei ?? 0n,
  };
}