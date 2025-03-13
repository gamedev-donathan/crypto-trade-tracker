import { importTradesFromZip } from './zipUtils';
import { Trade, PortfolioSettings } from '../types';
import { AppSettings } from '../context/TradeContext';

// Default save folder
export const DEFAULT_SAVE_FOLDER = 'save_data';

/**
 * Finds the most recent ZIP file in the save_data directory and imports it
 * @returns Promise that resolves to an object containing imported trades, portfolio settings, and app settings
 */
export const importMostRecentBackup = async (): Promise<{
  trades: Trade[];
  portfolioSettings?: PortfolioSettings;
  portfolioValue?: number;
  appSettings?: AppSettings;
  success: boolean;
  message: string;
}> => {
  try {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    // Create a promise that resolves when a file is selected
    const filePromise = new Promise<File>((resolve, reject) => {
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          resolve(files[0]);
        } else {
          reject(new Error('No file selected'));
        }
      };
    });
    
    // Trigger the file input
    input.click();
    
    // Wait for file selection
    const file = await filePromise;
    
    // Import the file
    const importResult = await importTradesFromZip(file);
    
    return {
      ...importResult,
      success: true,
      message: `Successfully imported from ${file.name}`
    };
  } catch (error) {
    console.error('Error importing backup:', error);
    return {
      trades: [],
      success: false,
      message: `Error importing backup: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Requests permission to access the save_data directory
 * @returns Promise that resolves to a boolean indicating whether permission was granted
 */
export const requestDirectoryPermission = async (): Promise<boolean> => {
  // Always return true since we're not using directory permissions anymore
  return true;
}; 