/**
 * Types for redeem operations
 */

export type PermissionType = 
  | 'native-token-periodic' 
  | 'erc20-token-periodic'
  | 'native-token-stream'
  | 'erc20-token-stream';

export interface RedeemHooks {
  beforeBuild?: (params: any) => Promise<any> | any;
  beforeRequest?: (request: any) => Promise<any> | any;
  afterRequest?: (response: any) => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
}

export interface RedeemResult {
  success: boolean;
  message?: string;
  redeemRequest?: any; // The prepared request object
  transactionHash?: string;
  recipient?: string;
  amount?: string;
  permissionType?: string;
  tokenAddress?: string | null;
  tokenDecimals?: number | null;
}
