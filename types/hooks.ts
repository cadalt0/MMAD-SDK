export interface PermissionHooks {
  beforeBuild?: (params: any) => Promise<any> | any;
  beforeRequest?: (request: any) => Promise<any> | any;
  afterRequest?: (response: any) => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
}
