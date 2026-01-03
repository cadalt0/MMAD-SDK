/**
 * Default values for redemptions
 */

export const DEFAULT_REDEEM_VALUES = {
  // Amount to redeem: 0.5 of the delegated amount (half)
  amount: '0.5',

  // Timeout for transaction confirmation
  confirmationTimeout: 60000, // 60 seconds

  // Max retries for failed transactions
  maxRetries: 3,
};
