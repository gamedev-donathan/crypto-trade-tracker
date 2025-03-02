/**
 * Utility functions for storing and retrieving user preferences in localStorage
 */

// Keys for localStorage
const KEYS = {
  QUANTITY_DISPLAY_MODE: 'crypto-tracker-quantity-display-mode',
};

type QuantityDisplayMode = 'tokens' | 'usd';

/**
 * Reset the quantity display mode to default (tokens)
 */
export const resetQuantityDisplayMode = (): void => {
  try {
    localStorage.removeItem(KEYS.QUANTITY_DISPLAY_MODE);
  } catch (error) {
    console.error('Error resetting quantity display mode in localStorage:', error);
  }
};

/**
 * Save the user's preferred quantity display mode to localStorage
 */
export const saveQuantityDisplayMode = (mode: QuantityDisplayMode): void => {
  try {
    localStorage.setItem(KEYS.QUANTITY_DISPLAY_MODE, mode);
  } catch (error) {
    console.error('Error saving quantity display mode to localStorage:', error);
  }
};

/**
 * Get the user's preferred quantity display mode from localStorage
 * @returns The saved mode or 'tokens' as default
 */
export const getQuantityDisplayMode = (): QuantityDisplayMode => {
  try {
    const savedMode = localStorage.getItem(KEYS.QUANTITY_DISPLAY_MODE) as QuantityDisplayMode | null;
    return savedMode || 'tokens';
  } catch (error) {
    console.error('Error retrieving quantity display mode from localStorage:', error);
    return 'tokens';
  }
}; 