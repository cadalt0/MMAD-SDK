/**
 * Session Account utilities
 * Create session account objects for permission requests
 */

/**
 * Create a session account object from address only
 * Private key is not needed for requesting permissions, only for redeeming
 */
export function createSessionAccountFromAddress(address: string) {
  return {
    address: address as `0x${string}`,
  } as any;
}
