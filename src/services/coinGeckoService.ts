import axios from 'axios';

const API_URL = 'https://api.coingecko.com/api/v3';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
}

export const coinGeckoService = {
  // Get list of coins with market data
  getCoins: async (): Promise<Coin[]> => {
    try {
      const response = await axios.get(`${API_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching coins from CoinGecko:', error);
      return [];
    }
  },

  // Search for coins by query
  searchCoins: async (query: string): Promise<Coin[]> => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: {
          query
        }
      });
      
      // Map the response to match our Coin interface
      return response.data.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.large || coin.thumb
      }));
    } catch (error) {
      console.error('Error searching coins from CoinGecko:', error);
      return [];
    }
  },

  // Get current price for a specific coin
  getCoinPrice: async (coinId: string): Promise<number | null> => {
    try {
      const response = await axios.get(`${API_URL}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd'
        }
      });
      
      return response.data[coinId]?.usd || null;
    } catch (error) {
      console.error(`Error fetching price for coin ${coinId}:`, error);
      return null;
    }
  }
};

export default coinGeckoService; 