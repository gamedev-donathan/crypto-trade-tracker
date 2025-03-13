import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Trade, Screenshot, PortfolioSettings } from '../types';
import { AppSettings } from '../context/TradeContext';

/**
 * Creates and downloads a ZIP file containing trade data, portfolio settings, and screenshots
 * @param trades Array of trades to export
 * @param filename Name of the ZIP file to download
 * @param portfolioSettings Portfolio settings to include in the export
 * @param portfolioValue Current portfolio value
 * @param appSettings Application settings to include in the export
 */
export const exportTradesAsZip = async (
  trades: Trade[], 
  filename: string = 'trades-with-screenshots.zip',
  portfolioSettings?: PortfolioSettings,
  portfolioValue?: number,
  appSettings?: AppSettings
): Promise<void> => {
  const zip = new JSZip();
  
  // Create a folder for the trade data
  const dataFolder = zip.folder('data');
  
  // Create a folder for screenshots
  const screenshotsFolder = zip.folder('screenshots');
  
  if (!dataFolder || !screenshotsFolder) {
    throw new Error('Failed to create folders in ZIP file');
  }
  
  // Add trade data as JSON, but first clean up the screenshot data to only include references
  const tradesWithScreenshotRefs = trades.map(trade => {
    const { screenshots, ...tradeData } = trade;
    
    // If the trade has screenshots, replace the data with references
    if (screenshots && screenshots.length > 0) {
      return {
        ...tradeData,
        screenshots: screenshots.map(screenshot => ({
          id: screenshot.id,
          timestamp: screenshot.timestamp,
          label: screenshot.label,
          type: screenshot.type,
          filename: `${screenshot.id}.png` // Reference to the screenshot file
        }))
      };
    }
    
    return tradeData;
  });
  
  // Create the export data object with trades and portfolio information
  const exportData = {
    trades: tradesWithScreenshotRefs,
    portfolioSettings,
    portfolioValue,
    appSettings,
    exportDate: new Date().toISOString()
  };
  
  // Add the export data to the ZIP file
  dataFolder.file('trades.json', JSON.stringify(exportData, null, 2));
  
  // Add screenshots to the ZIP file
  for (const trade of trades) {
    if (trade.screenshots && trade.screenshots.length > 0) {
      for (const screenshot of trade.screenshots) {
        // Extract the base64 data (remove the data:image/png;base64, prefix)
        const base64Data = screenshot.data.split(',')[1];
        
        // Add the screenshot to the ZIP file
        screenshotsFolder.file(`${screenshot.id}.png`, base64Data, { base64: true });
      }
    }
  }
  
  // Generate the ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  
  // Download the ZIP file
  saveAs(content, filename);
};

/**
 * Imports trades from a ZIP file containing trade data and screenshots
 * @param file ZIP file to import
 * @returns Promise that resolves to an object containing imported trades, portfolio settings, and app settings
 */
export const importTradesFromZip = async (file: File): Promise<{
  trades: Trade[];
  portfolioSettings?: PortfolioSettings;
  portfolioValue?: number;
  appSettings?: AppSettings;
}> => {
  const zip = await JSZip.loadAsync(file);
  
  // Extract the trade data
  const tradesFile = zip.file('data/trades.json');
  if (!tradesFile) {
    throw new Error('Invalid ZIP file: missing trades.json');
  }
  
  const tradesJson = await tradesFile.async('string');
  const importedData = JSON.parse(tradesJson);
  
  // Handle both old and new format
  let trades: Trade[];
  let portfolioSettings: PortfolioSettings | undefined;
  let portfolioValue: number | undefined;
  let appSettings: AppSettings | undefined;
  
  if (Array.isArray(importedData)) {
    // Old format - just an array of trades
    trades = importedData;
  } else {
    // New format - object with trades and portfolio settings
    trades = importedData.trades || [];
    portfolioSettings = importedData.portfolioSettings;
    portfolioValue = importedData.portfolioValue;
    appSettings = importedData.appSettings;
  }
  
  // Process each trade to load its screenshots
  for (const trade of trades) {
    if (trade.screenshots && trade.screenshots.length > 0) {
      const loadedScreenshots: Screenshot[] = [];
      
      for (const screenshotRef of trade.screenshots) {
        // Get the screenshot file from the ZIP
        const screenshotFile = zip.file(`screenshots/${screenshotRef.filename}`);
        
        if (screenshotFile) {
          // Load the screenshot data
          const base64Data = await screenshotFile.async('base64');
          
          // Create a complete screenshot object
          loadedScreenshots.push({
            id: screenshotRef.id,
            timestamp: screenshotRef.timestamp,
            label: screenshotRef.label,
            type: screenshotRef.type,
            data: `data:image/png;base64,${base64Data}`
          });
        }
      }
      
      // Replace the screenshot references with the loaded screenshots
      trade.screenshots = loadedScreenshots;
    }
  }
  
  return { trades, portfolioSettings, portfolioValue, appSettings };
};

/**
 * Creates a ZIP blob containing trade data, portfolio settings, and screenshots
 * @param trades Array of trades to export
 * @param portfolioSettings Portfolio settings to include in the export
 * @param portfolioValue Current portfolio value
 * @param appSettings Application settings to include in the export
 * @returns Promise that resolves to a Blob containing the ZIP file
 */
export const createZipBlob = async (
  trades: Trade[],
  portfolioSettings?: PortfolioSettings,
  portfolioValue?: number,
  appSettings?: AppSettings
): Promise<Blob> => {
  const zip = new JSZip();
  
  // Create a folder for the trade data
  const dataFolder = zip.folder('data');
  
  // Create a folder for screenshots
  const screenshotsFolder = zip.folder('screenshots');
  
  if (!dataFolder || !screenshotsFolder) {
    throw new Error('Failed to create folders in ZIP file');
  }
  
  // Add trade data as JSON, but first clean up the screenshot data to only include references
  const tradesWithScreenshotRefs = trades.map(trade => {
    const { screenshots, ...tradeData } = trade;
    
    // If the trade has screenshots, replace the data with references
    if (screenshots && screenshots.length > 0) {
      return {
        ...tradeData,
        screenshots: screenshots.map(screenshot => ({
          id: screenshot.id,
          timestamp: screenshot.timestamp,
          label: screenshot.label,
          type: screenshot.type,
          filename: `${screenshot.id}.png` // Reference to the screenshot file
        }))
      };
    }
    
    return tradeData;
  });
  
  // Create the export data object with trades and portfolio information
  const exportData = {
    trades: tradesWithScreenshotRefs,
    portfolioSettings,
    portfolioValue,
    appSettings,
    exportDate: new Date().toISOString()
  };
  
  // Add the export data to the ZIP file
  dataFolder.file('trades.json', JSON.stringify(exportData, null, 2));
  
  // Add screenshots to the ZIP file
  for (const trade of trades) {
    if (trade.screenshots && trade.screenshots.length > 0) {
      for (const screenshot of trade.screenshots) {
        // Extract the base64 data (remove the data:image/png;base64, prefix)
        const base64Data = screenshot.data.split(',')[1];
        
        // Add the screenshot to the ZIP file
        screenshotsFolder.file(`${screenshot.id}.png`, base64Data, { base64: true });
      }
    }
  }
  
  // Generate and return the ZIP file as a blob
  return await zip.generateAsync({ type: 'blob' });
}; 