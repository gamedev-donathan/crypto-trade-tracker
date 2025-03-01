# Cryptocurrency Trade Tracker

A React application for tracking cryptocurrency trades using Mark Minervini risk management strategies.

## Features

- **Trade Management**: Add, edit, and delete cryptocurrency trades
- **Risk Analysis**: Calculate and display risk percentage based on entry price, stop loss, and position size
- **Stop Loss Management**: Update stop loss levels for active trades
- **Performance Tracking**: View win/loss ratio, profit factor, and overall trading performance
- **Bitcoin Comparison**: Compare your trading performance against a simple Bitcoin DCA (Dollar Cost Averaging) strategy
- **CoinGecko Integration**: Search and select from thousands of cryptocurrencies using the CoinGecko API
- **Flexible Quantity Input**: Enter position size in either coins or dollars

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd crypto-trade-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

The application will be available at http://localhost:3000

## Usage

### Dashboard

The dashboard provides an overview of your trading performance, including:
- Total number of trades
- Win rate
- Total profit/loss
- Profit factor
- Win/loss ratio chart
- Comparison with Bitcoin DCA strategy

### Adding a Trade

To add a new trade:
1. Navigate to the "Add Trade" page
2. Select position type (Long or Short)
3. Search for a cryptocurrency using the CoinGecko API or enter a custom one
4. Enter the entry price (auto-populated for selected cryptocurrencies)
5. Enter the quantity and select the quantity type (coins or dollars)
6. Set your stop loss
7. Add optional notes
8. Review the risk analysis (risk should ideally be below 2% of portfolio value)
9. Click "Add Trade"

### Managing Trades

On the "Trade List" page, you can:
- View all active and closed trades
- Update stop loss levels for active trades
- Close trades by entering an exit price
- Delete trades
- See equivalent coin amounts for trades entered in dollars

## Risk Management

This application implements Mark Minervini's risk management principles:
- Risk per trade is calculated as a percentage of your total portfolio value
- The application highlights when risk exceeds 2% of your portfolio
- Stop loss management helps maintain discipline and limit losses

## Technologies Used

- React
- TypeScript
- Material-UI
- React Router
- Chart.js
- CoinGecko API

## License

This project is licensed under the MIT License - see the LICENSE file for details.
