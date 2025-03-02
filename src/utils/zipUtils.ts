import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Trade, Screenshot } from '../types';

/**
 * Creates and downloads a ZIP file containing trade data and screenshots
 * @param trades Array of trades to export
 * @param filename Name of the ZIP file to download
 */
export const exportTradesAsZip = async (trades: Trade[], filename: string = 'trades-with-screenshots.zip'): Promise<void> => {
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
  
  // Add the trade data to the ZIP file
  dataFolder.file('trades.json', JSON.stringify(tradesWithScreenshotRefs, null, 2));
  
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
 * @returns Promise that resolves to an array of imported trades
 */
export const importTradesFromZip = async (file: File): Promise<Trade[]> => {
  const zip = await JSZip.loadAsync(file);
  
  // Extract the trade data
  const tradesFile = zip.file('data/trades.json');
  if (!tradesFile) {
    throw new Error('Invalid ZIP file: missing trades.json');
  }
  
  const tradesJson = await tradesFile.async('string');
  const trades: Trade[] = JSON.parse(tradesJson);
  
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
  
  return trades;
}; 