/**
 * Unit tests for StockQuotesService
 */

import type { YahooClient } from '../src/yahooFinanceClient.js';
import { StockQuotesService } from '../src/stockQuotesService.js';
import { HistoricalData, StockQuoteResponse, StockSearchResult } from '../src/types.js';

// Mock the yahoo-finance2 module globally for this test file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockQuote = jest.fn<Promise<any | any[]>, [string | string[]]>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSearch = jest.fn<Promise<any>, [string]>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockChart = jest.fn<Promise<any>, [string]>();

jest.mock('yahoo-finance2', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      quote: mockQuote,
      search: mockSearch,
      chart: mockChart,
    })),
  };
});

describe('StockQuotesService', () => {
  let service: StockQuotesService;
  let mockYahooClient: YahooClient;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a mock YahooClient that implements the interface
    mockYahooClient = {
      quote: mockQuote,
      search: mockSearch,
      chart: mockChart,
    };

    service = new StockQuotesService(mockYahooClient);
  });

  describe('getQuote', () => {
    it('should fetch a single stock quote', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuoteResult: any = {
        symbol: 'AAPL',
        shortName: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        regularMarketPrice: 170.0,
        regularMarketChange: 1.0,
        regularMarketChangePercent: 0.59,
        regularMarketVolume: 100000000,
        marketCap: 2800000000000,
        fiftyTwoWeekLow: 130.0,
        fiftyTwoWeekHigh: 180.0,
        averageDailyVolume3Month: 90000000,
        trailingPE: 25.0,
        forwardPE: 23.0,
        dividendYield: 0.005,
        epsTrailingTwelveMonths: 6.8,
        epsForward: 7.3,
        bookValue: 10.0,
        priceToBook: 17.0,
        marketState: 'REGULAR',
        quoteType: 'EQUITY',
      };
      mockQuote.mockResolvedValue(mockQuoteResult);

      const ticker = 'AAPL';
      const quote = await service.getQuote({ ticker });

      expect(quote).toEqual({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        regularMarketPrice: 170.0,
        regularMarketChange: 1.0,
        regularMarketChangePercent: 0.59,
        regularMarketVolume: 100000000,
        marketCap: 2800000000000,
        fiftyTwoWeekLow: 130.0,
        fiftyTwoWeekHigh: 180.0,
        averageDailyVolume3Month: 90000000,
        trailingPE: 25.0,
        forwardPE: 23.0,
        dividendYield: 0.005,
        epsTrailingTwelveMonths: 6.8,
        epsForward: 7.3,
        bookValue: 10.0,
        priceToBook: 17.0,
        marketState: 'REGULAR',
        quoteType: 'EQUITY',
      });
      expect(mockQuote).toHaveBeenCalledWith(ticker, undefined);
    });

    it('should throw an error if the stock ticker is not found for getQuote', async () => {
      mockQuote.mockResolvedValue(undefined);

      const ticker = 'NONEXISTENT';
      await expect(service.getQuote({ ticker })).rejects.toThrow(
        `Stock ticker 'NONEXISTENT' not found`
      );
    });

    it('should handle array return from yahoo-finance2.quote for getQuote', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuoteResultArray: any[] = [
        {
          symbol: 'GOOG',
          shortName: 'Alphabet Inc. (GOOG)',
          exchange: 'NASDAQ',
          currency: 'USD',
          regularMarketPrice: 100.0,
        },
      ];
      mockQuote.mockResolvedValue(mockQuoteResultArray);

      const ticker = 'GOOG';
      const quote = await service.getQuote({ ticker });

      expect(quote.symbol).toBe('GOOG');
      expect(quote.name).toBe('Alphabet Inc. (GOOG)');
    });
  });

  describe('getMultipleQuotes', () => {
    it('should fetch multiple stock quotes and handle errors gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aaplQuote: any = { symbol: 'AAPL', regularMarketPrice: 170 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msftQuote: any = { symbol: 'MSFT', regularMarketPrice: 250 };

      mockQuote
        .mockResolvedValueOnce(aaplQuote) // For AAPL
        .mockRejectedValueOnce(new Error('Ticker not found')) // For NONEXISTENT
        .mockResolvedValueOnce(msftQuote); // For MSFT

      const tickers = ['AAPL', 'NONEXISTENT', 'MSFT'];
      const results = await service.getMultipleQuotes(tickers);

      expect(results.size).toBe(2);
      expect(results.get('AAPL')).toEqual({
        symbol: 'AAPL',
        regularMarketPrice: 170,
      });
      expect(results.get('MSFT')).toEqual({
        symbol: 'MSFT',
        regularMarketPrice: 250,
      });
      expect(results.has('NONEXISTENT')).toBe(false);

      errorSpy.mockRestore();
    });

    it('should return empty map when all tickers fail', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockQuote
        .mockRejectedValueOnce(new Error('Ticker 1 not found'))
        .mockRejectedValueOnce(new Error('Ticker 2 not found'));

      const tickers = ['INVALID1', 'INVALID2'];
      const results = await service.getMultipleQuotes(tickers);

      expect(results.size).toBe(0);

      errorSpy.mockRestore();
    });

    it('should handle single ticker array', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aaplQuote: any = { symbol: 'AAPL', regularMarketPrice: 170 };
      mockQuote.mockResolvedValueOnce(aaplQuote);

      const tickers = ['AAPL'];
      const results = await service.getMultipleQuotes(tickers);

      expect(results.size).toBe(1);
      expect(results.get('AAPL')).toEqual(aaplQuote);
    });
  });

  describe('search', () => {
    it('should search for stocks and return results', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSearchResult: any = {
        quotes: [
          { symbol: 'AAPL', shortname: 'Apple Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
          {
            symbol: 'GOOGL',
            longname: 'Alphabet Inc. (GOOGL)',
            exchange: 'NASDAQ',
            quoteType: 'EQUITY',
          },
        ],
        news: [], // Assuming news is not relevant for this test
        researchReports: [],
      };
      mockSearch.mockResolvedValue(mockSearchResult);

      const query = 'Apple';
      const results = await service.search(query);

      expect(results).toEqual([
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (GOOGL)', exchange: 'NASDAQ' },
      ]);
      expect(mockSearch).toHaveBeenCalledWith(query);
    });

    it('should return empty array if no search results are found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSearchResult: any = {
        quotes: [],
        news: [],
        researchReports: [],
      };
      mockSearch.mockResolvedValue(mockSearchResult);

      const query = 'XYZXYZ';
      const results = await service.search(query);

      expect(results).toEqual([]);
      expect(mockSearch).toHaveBeenCalledWith(query);
    });

    it('should handle quotes with longname instead of shortname', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSearchResult: any = {
        quotes: [
          {
            symbol: 'GOOGL',
            longname: 'Alphabet Inc. (GOOGL)',
            exchange: 'NASDAQ',
            quoteType: 'EQUITY',
          },
        ],
        news: [],
        researchReports: [],
      };
      mockSearch.mockResolvedValue(mockSearchResult);

      const query = 'test';
      const results = await service.search(query);

      expect(results).toEqual([
        { symbol: 'GOOGL', name: 'Alphabet Inc. (GOOGL)', exchange: 'NASDAQ' },
      ]);
    });

    it('should handle search error', async () => {
      mockSearch.mockRejectedValue(new Error('Search API error'));

      await expect(service.search('test')).rejects.toThrow('Search API error');
    });
  });

  describe('getHistoricalData', () => {
    it('should fetch historical data and return closing prices', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockChartResult: any = {
        quotes: [
          { date: new Date('2023-01-01'), close: 100, high: 105, low: 95, volume: 1000000 },
          { date: new Date('2023-01-02'), close: 101, high: 106, low: 96, volume: 1200000 },
          { date: new Date('2023-01-03'), close: 102, high: 107, low: 97, volume: 1100000 },
        ],
      };

      mockChart.mockResolvedValue(mockChartResult);

      const ticker = 'AAPL';
      const fromDate = '2023-01-01';
      const toDate = '2023-01-03';

      const historicalData = await service.getHistoricalData(ticker, fromDate, toDate);

      expect(historicalData).toEqual([
        { date: '2023-01-01', close: 100, high: 105, low: 95, volume: 1000000 },
        { date: '2023-01-02', close: 101, high: 106, low: 96, volume: 1200000 },
        { date: '2023-01-03', close: 102, high: 107, low: 97, volume: 1100000 },
      ]);
      expect(mockChart).toHaveBeenCalledWith(ticker, { period1: fromDate, period2: toDate });
    });

    it('should throw an error if historical data fetch fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'Network error';

      mockChart.mockRejectedValue(new Error(errorMessage));

      const ticker = 'MSFT';
      const fromDate = '2023-01-01';
      const toDate = '2023-01-03';

      await expect(service.getHistoricalData(ticker, fromDate, toDate)).rejects.toThrow(
        `Could not fetch historical data for ${ticker}. Please check the ticker and date range.`
      );

      errorSpy.mockRestore();
    });

    it('should return empty array if no historical data is available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockChartResult: any = {
        quotes: [],
      };

      mockChart.mockResolvedValue(mockChartResult);

      const ticker = 'AAPL';
      const fromDate = '2023-01-01';
      const toDate = '2023-01-03';

      const historicalData = await service.getHistoricalData(ticker, fromDate, toDate);

      expect(historicalData).toEqual([]);
    });
  });
});
