# Crypto Trade Tracker

A comprehensive application for tracking cryptocurrency trades, analyzing portfolio performance, and managing your trading history.

## Features

### Core Features
- **Trade Management**: Add, edit, and close cryptocurrency trades
- **Portfolio Analysis**: View portfolio performance over time with charts and statistics
- **Trade List**: View and filter all your trades in a sortable table
- **Screenshots**: Attach screenshots to your trades for reference
- **Import/Export**: Backup and restore your trade data

### New Features
- **Auto-Save**: Automatically save your trade data at regular intervals to the `save_data` folder
- **Auto-Import**: Automatically import the most recent backup on application startup
- **Dark Mode**: Toggle between light and dark themes
- **Portfolio Settings**: Configure your portfolio name, description, and other settings
- **Customizable Settings**: Set default currency, valuation mode, and decimal precision

## Settings

### Application Settings
- **Dark Mode**: Toggle between light and dark themes
- **Default Currency**: Set your preferred currency (USD, EUR, GBP, etc.)
- **Default Valuation Mode**: Choose between USD value or coin amount display
- **Decimal Precision**: Set the number of decimal places for cryptocurrency amounts

### Portfolio Settings
- **Portfolio Name**: Give your portfolio a name
- **Description**: Add a description for your portfolio
- **Initial Balance**: Set your starting balance
- **Start Date**: Set the start date for your portfolio

### Auto-Save Settings
- **Enable Auto-Save**: Toggle automatic saving of your trade data
- **Auto-Save Interval**: Set how often your data is automatically saved (in minutes)
- **Save Directory**: Choose where your backup files are saved (defaults to `save_data` folder)
- **Manual Save**: Trigger a manual save at any time

## Automatic Backup and Recovery

The application includes a robust backup and recovery system:

1. **Periodic Auto-Save**: When enabled, your trade data is automatically saved to the `save_data` folder at the interval you specify.

2. **Auto-Import on Startup**: When the application starts, it automatically checks the `save_data` folder for the most recent backup file and imports it.

3. **Versioned Backups**: Each backup is saved with a timestamp in the filename, allowing you to recover from different points in time if needed.

4. **File System Access**: The application uses the modern File System Access API to securely access your local file system for saving and loading backups.

## Technical Details

### File System Access
The application uses the modern File System Access API when available, with fallbacks for browsers that don't support it. This allows for:
- Selecting directories for auto-save
- Saving files directly to your file system
- Improved user experience with native file dialogs
- Automatic recovery from the most recent backup

### Data Format
Trade data is exported in a structured ZIP format that includes:
- JSON data file with all trade information
- Portfolio settings and current value
- Application settings for consistent experience
- Screenshots associated with trades
- Export timestamp for reference

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Access the application at `http://localhost:3000`
5. On first run, you'll be prompted to grant permission to access the `save_data` folder for auto-save/import

## License

This project is licensed under the MIT License - see the LICENSE file for details.
