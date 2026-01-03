export type PermissionType = 
  | 'native-token-periodic' 
  | 'erc20-token-periodic'
  | 'native-token-stream'
  | 'erc20-token-stream';

export interface PermissionBuildResult {
  request: any;
  context?: any;
}
