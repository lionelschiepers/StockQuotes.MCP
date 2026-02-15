import { registerToolsOnServer } from '../src/toolRegistration.js';
import type { StockQuotesService } from '../src/stockQuotesService.js';

describe('Tool Registration', () => {
  let mockServer: any;
  let mockStockService: any;
  let registeredTools: Record<string, any>;

  beforeEach(() => {
    registeredTools = {};
    mockServer = {
      registerTool: jest.fn((name, config, handler) => {
        registeredTools[name] = { config, handler };
      }),
    };
    mockStockService = {
      getQuote: jest.fn(),
      getQuotes: jest.fn(),
      search: jest.fn(),
      getHistoricalData: jest.fn(),
    };
  });

  it('should register all tools', () => {
    registerToolsOnServer(mockServer, mockStockService as StockQuotesService);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(4);
    expect(registeredTools['get_stock_quote']).toBeDefined();
    expect(registeredTools['get_stock_quotes']).toBeDefined();
    expect(registeredTools['search_stocks']).toBeDefined();
    expect(registeredTools['get_historical_data']).toBeDefined();
  });

  describe('get_stock_quote handler', () => {
    it('should call getQuote and return formatted result', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_stock_quote'].handler;

      const mockQuote = { symbol: 'AAPL', price: 150 };
      mockStockService.getQuote.mockResolvedValue(mockQuote);

      const result = await handler({ ticker: 'AAPL' });

      expect(mockStockService.getQuote).toHaveBeenCalledWith({ ticker: 'AAPL' });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockQuote, null, 2),
          },
        ],
        structuredContent: mockQuote,
      });
    });

    it('should throw error when getQuote fails', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_stock_quote'].handler;

      const error = new Error('Ticker not found');
      mockStockService.getQuote.mockRejectedValue(error);

      await expect(handler({ ticker: 'INVALID' })).rejects.toThrow('Ticker not found');
    });
  });

  describe('get_stock_quotes handler', () => {
    it('should call getQuotes and return formatted result', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_stock_quotes'].handler;

      const mockQuotes = [
        { symbol: 'AAPL', price: 150 },
        { symbol: 'MSFT', price: 250 },
      ];
      mockStockService.getQuotes.mockResolvedValue(mockQuotes);

      const result = await handler({ tickers: ['AAPL', 'MSFT'] });

      expect(mockStockService.getQuotes).toHaveBeenCalledWith({ tickers: ['AAPL', 'MSFT'] });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockQuotes, null, 2),
          },
        ],
        structuredContent: { quotes: mockQuotes },
      });
    });

    it('should throw error when getQuotes fails', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_stock_quotes'].handler;

      const error = new Error('Batch fetch failed');
      mockStockService.getQuotes.mockRejectedValue(error);

      await expect(handler({ tickers: ['INVALID'] })).rejects.toThrow('Batch fetch failed');
    });
  });

  describe('search_stocks handler', () => {
    it('should call search and return formatted result', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['search_stocks'].handler;

      const mockResults = [{ symbol: 'AAPL', name: 'Apple' }];
      mockStockService.search.mockResolvedValue(mockResults);

      const result = await handler({ query: 'Apple' });

      expect(mockStockService.search).toHaveBeenCalledWith('Apple');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
        structuredContent: { results: mockResults },
      });
    });

    it('should throw error when search fails', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['search_stocks'].handler;

      const error = new Error('Search failed');
      mockStockService.search.mockRejectedValue(error);

      await expect(handler({ query: 'invalid' })).rejects.toThrow('Search failed');
    });
  });

  describe('get_historical_data handler', () => {
    it('should call getHistoricalData and return formatted result', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_historical_data'].handler;

      const mockData = [{ date: '2023-01-01', close: 100 }];
      mockStockService.getHistoricalData.mockResolvedValue(mockData);

      const params = { ticker: 'AAPL', fromDate: '2023-01-01', toDate: '2023-01-10' };
      const result = await handler(params);

      expect(mockStockService.getHistoricalData).toHaveBeenCalledWith(
        'AAPL',
        '2023-01-01',
        '2023-01-10',
        undefined
      );
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ closingPrices: mockData }, null, 2),
          },
        ],
        structuredContent: { closingPrices: mockData },
      });
    });

    it('should call getHistoricalData with fields and return formatted result', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_historical_data'].handler;

      const mockData = [{ date: '2023-01-01', close: 100 }];
      mockStockService.getHistoricalData.mockResolvedValue(mockData);

      const params = {
        ticker: 'AAPL',
        fromDate: '2023-01-01',
        toDate: '2023-01-10',
        fields: ['close'],
      };
      const result = await handler(params);

      expect(mockStockService.getHistoricalData).toHaveBeenCalledWith(
        'AAPL',
        '2023-01-01',
        '2023-01-10',
        ['close']
      );
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ closingPrices: mockData }, null, 2),
          },
        ],
        structuredContent: { closingPrices: mockData },
      });
    });

    it('should throw error when getHistoricalData fails', async () => {
      registerToolsOnServer(mockServer, mockStockService as StockQuotesService);
      const handler = registeredTools['get_historical_data'].handler;

      const error = new Error('Historical data fetch failed');
      mockStockService.getHistoricalData.mockRejectedValue(error);

      const params = { ticker: 'AAPL', fromDate: '2023-01-01', toDate: '2023-01-10' };
      await expect(handler(params)).rejects.toThrow('Historical data fetch failed');
    });
  });
});
