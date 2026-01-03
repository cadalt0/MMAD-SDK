// Custom errors for the MetaMask Advanced Permissions SDK
export class MissingBrowserProviderError extends Error {
  constructor() {
    super('No EIP-1193 provider found. Pass provider in config or ensure window.ethereum is available.');
    this.name = 'MissingBrowserProviderError';
  }
}

export class MissingRequestExecutionPermissionsError extends Error {
  constructor() {
    super('Wallet client does not expose requestExecutionPermissions. Ensure erc7715 middleware is enabled.');
    this.name = 'MissingRequestExecutionPermissionsError';
  }
}

export class UserRejectedError extends Error {
  constructor(message = 'User rejected the request.') {
    super(message);
    this.name = 'UserRejectedError';
  }
}

export class InvalidPermissionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionConfigError';
  }
}
