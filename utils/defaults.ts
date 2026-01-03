/**
 * Default values and presets for permissions
 */

const getCurrentTime = () => Math.floor(Date.now() / 1000);

export const DEFAULT_PERMISSION_VALUES = {
  // Periodic permissions
  amount: '1',
  periodDuration: 86400, // 1 day
  
  // Stream permissions
  amountPerSecond: '0.00001',
  initialAmount: '0.1',
  maxAmount: '1',
  getStartTime: getCurrentTime,
  
  // Common
  getExpiry: () => getCurrentTime() + 7 * 24 * 60 * 60, // 1 week
  justification: 'Permission to execute token transfers',
  isAdjustmentAllowed: true,
};
