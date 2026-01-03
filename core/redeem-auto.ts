/**
 * Auto Redeem - Complete end-to-end redemption
 * User passes: permissionsContext, amount, recipient
 * SDK handles: building call data, signing, submitting
 * 100% customizable via hooks
 */

import { parseUnits } from 'viem';
import { InvalidPermissionConfigError } from '../errors';
import type { RedeemResult } from '../types/redeem';
import { buildRedeemCallData } from '../utils/redeem-call-data';

export interface AutoRedeemOptions {
  // Minimal required
  permissionsContext: string;
  recipient: string;
  amount: string;
  
  // Auto-detect or specify
  permissionType?: 'native-token-periodic' | 'erc20-token-periodic' | 'native-token-stream' | 'erc20-token-stream';
  
  // For ERC-20 only
  tokenAddress?: string;
  tokenDecimals?: number;
  
  // Execution
  walletClient?: any;
  backendEndpoint?: string; // Default: '/api/redeem'
  delegationManager?: string; // Needed for call data build (wallet path)
  valueWei?: bigint; // Optional native value override
  
  // Customization hooks
  hooks?: {
    beforeBuild?: (data: any) => Promise<any> | any;
    beforeSubmit?: (tx: any) => Promise<any> | any;
    afterSubmit?: (result: any) => Promise<void> | void;
    onError?: (error: any) => Promise<void> | void;
  };
}

export async function autoRedeem(options: AutoRedeemOptions): Promise<RedeemResult> {
  // Validate required fields
  if (!options.permissionsContext) {
    throw new InvalidPermissionConfigError('permissionsContext is required');
  }
  if (!options.recipient || !options.recipient.startsWith('0x')) {
    throw new InvalidPermissionConfigError('recipient must be a valid Ethereum address');
  }
  if (!options.amount || Number(options.amount) <= 0) {
    throw new InvalidPermissionConfigError('amount must be greater than zero');
  }

  const hooks = options.hooks || {};

  try {
    const permissionType = options.permissionType || 'native-token-periodic';

    // Build the complete redeem request
    let redeemData: any = {
      permissionsContext: options.permissionsContext,
      recipient: options.recipient,
      amount: options.amount,
      permissionType,
    };

    // Add optional fields
    if (options.tokenAddress) redeemData.tokenAddress = options.tokenAddress;
    if (options.tokenDecimals !== undefined) redeemData.tokenDecimals = options.tokenDecimals;

    // Hook: allow modification before building
    redeemData = await (hooks.beforeBuild?.(redeemData) || Promise.resolve(redeemData));

    // Submit to backend (default) or wallet
    if (options.backendEndpoint || !options.walletClient) {
      // Use backend
      const endpoint = options.backendEndpoint || '/api/redeem';
      
      const txData = {
        ...redeemData,
        timestamp: Date.now(),
      };

      // Hook: customize before submit
      const finalData = await (hooks.beforeSubmit?.(txData) || Promise.resolve(txData));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to redeem permission';
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          errorMsg = `HTTP ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const result: RedeemResult = await response.json();
      await hooks.afterSubmit?.(result);
      return result;
    }

    // Wallet-based execution (if walletClient provided)
    if (options.walletClient) {
      if (!options.delegationManager) {
        throw new InvalidPermissionConfigError('delegationManager is required for wallet-based redeem');
      }

      const tx = buildRedeemCallData({
        ...options,
        permissionType,
        delegationManager: options.delegationManager,
      });

      const txRequest = await (hooks.beforeSubmit?.(tx) || Promise.resolve(tx));

      const hash = await options.walletClient.sendTransaction({
        to: txRequest.to,
        data: txRequest.data,
        value: txRequest.value,
      });

      const result: RedeemResult = {
        success: true,
        redeemRequest: txRequest,
        transactionHash: hash,
        message: 'Redemption transaction sent',
      };

      await hooks.afterSubmit?.(result);
      return result;
    }

    // Fallback
    return {
      success: true,
      redeemRequest: redeemData,
      message: 'Redeem request prepared',
    };
  } catch (error: any) {
    await hooks.onError?.(error);
    throw error;
  }
}
