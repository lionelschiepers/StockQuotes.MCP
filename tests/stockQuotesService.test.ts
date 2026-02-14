import { StockQuotesService } from '../src/stockQuotesService.js';
import { logger } from '../src/logger.js';
import { ValidationError } from '../src/errors.js';
import type { YahooClient } from '../src/yahooFinanceClient.js';

// Mock logger
jest.mock('../src/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

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

    it('should remove undefined fields from response', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuoteResult: any = {
        symbol: 'TEST',
        shortName: 'Test Inc.',
        // Missing optional fields like regularMarketChange
      };
      mockQuote.mockResolvedValue(mockQuoteResult);

      const ticker = 'TEST';
      const quote = await service.getQuote({ ticker });

      expect(quote.symbol).toBe('TEST');
      expect(quote.name).toBe('Test Inc.');
      expect(quote).not.toHaveProperty('regularMarketChange');
      expect(quote).not.toHaveProperty('dividendYield');
    });

    it('should throw rate limit error', async () => {
      mockQuote.mockRejectedValue(new Error('Some rate limit error occurred'));
      await expect(service.getQuote({ ticker: 'AAPL' })).rejects.toThrow(
        'Rate limit exceeded. Please try again later'
      );
    });

    it('should throw generic error', async () => {
      mockQuote.mockRejectedValue(new Error('Generic failure'));
      await expect(service.getQuote({ ticker: 'AAPL' })).rejects.toThrow('Generic failure');
    });

    it('should filter empty fields', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuoteResult: any = { symbol: 'AAPL' };
      mockQuote.mockResolvedValue(mockQuoteResult);

      await service.getQuote({ ticker: 'AAPL', fields: ['field1', '', 'field2'] });

      expect(mockQuote).toHaveBeenCalledWith('AAPL', { fields: ['field1', 'field2'] });
    });
  });

  describe('getQuotes', () => {
    it('should fetch multiple stock quotes in one call', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuotesResult: any[] = [
        {
          symbol: 'AAPL',
          shortName: 'Apple Inc.',
          regularMarketPrice: 170.0,
        },
        {
          symbol: 'MSFT',
          shortName: 'Microsoft Corporation',
          regularMarketPrice: 250.0,
        },
      ];
      mockQuote.mockResolvedValue(mockQuotesResult);

      const tickers = ['AAPL', 'MSFT'];
      const quotes = await service.getQuotes({ tickers });

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('MSFT');
      expect(mockQuote).toHaveBeenCalledWith(tickers, undefined);
    });

    it('should handle single result from yahoo-finance2.quote for getQuotes', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockQuoteResult: any = {
        symbol: 'AAPL',
        shortName: 'Apple Inc.',
        regularMarketPrice: 170.0,
      };
      mockQuote.mockResolvedValue(mockQuoteResult);

      const tickers = ['AAPL'];
      const quotes = await service.getQuotes({ tickers });

      expect(quotes).toHaveLength(1);
      expect(quotes[0].symbol).toBe('AAPL');
    });

    it('should throw NotFoundError if no results are returned for getQuotes', async () => {
      mockQuote.mockResolvedValue(undefined);

      const tickers = ['NONEXISTENT'];
      await expect(service.getQuotes({ tickers })).rejects.toThrow(
        'Stock tickers not found: NONEXISTENT'
      );
    });

    it('should handle rate limit error for getQuotes', async () => {
      mockQuote.mockRejectedValue(new Error('Some rate limit error occurred'));
      await expect(service.getQuotes({ tickers: ['AAPL'] })).rejects.toThrow(
        'Rate limit exceeded. Please try again later'
      );
    });
  });

  describe('getMultipleQuotes', () => {
    it('should fetch multiple stock quotes and handle errors gracefully', async () => {
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
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch quote for NONEXISTENT',
        expect.objectContaining({ ticker: 'NONEXISTENT', error: expect.any(Error) })
      );
    });

    it('should return empty map when all tickers fail', async () => {
      mockQuote
        .mockRejectedValueOnce(new Error('Ticker 1 not found'))
        .mockRejectedValueOnce(new Error('Ticker 2 not found'));

      const tickers = ['INVALID1', 'INVALID2'];
      const results = await service.getMultipleQuotes(tickers);

      expect(results.size).toBe(0);
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
      expect(mockChart).toHaveBeenCalledWith(ticker, { period1: fromDate, period2: '2023-01-04' });
    });

    it('should throw ValidationError for invalid fromDate format', async () => {
      await expect(service.getHistoricalData('AAPL', 'invalid-date', '2023-01-01')).rejects.toThrow(
        ValidationError
      );
      await expect(service.getHistoricalData('AAPL', 'invalid-date', '2023-01-01')).rejects.toThrow(
        /Invalid fromDate/
      );
    });

    it('should throw ValidationError for invalid toDate format', async () => {
      await expect(service.getHistoricalData('AAPL', '2023-01-01', 'invalid-date')).rejects.toThrow(
        ValidationError
      );
      await expect(service.getHistoricalData('AAPL', '2023-01-01', 'invalid-date')).rejects.toThrow(
        /Invalid toDate/
      );
    });

    it('should throw ValidationError if fromDate is in the future', async () => {
      const futureDate = '2099-01-01';
      await expect(service.getHistoricalData('AAPL', futureDate, '2099-01-02')).rejects.toThrow(
        'fromDate cannot be in the future.'
      );
    });

    it('should throw ValidationError if fromDate is after toDate', async () => {
      await expect(service.getHistoricalData('AAPL', '2023-01-02', '2023-01-01')).rejects.toThrow(
        'fromDate must be before or equal to toDate.'
      );
    });

    it('should throw ValidationError if date range exceeds 5 years', async () => {
      await expect(service.getHistoricalData('AAPL', '2010-01-01', '2016-01-01')).rejects.toThrow(
        'Date range cannot exceed 5 years.'
      );
    });

    it('should throw an error if historical data fetch fails', async () => {
      const errorMessage = 'Network error';

      mockChart.mockRejectedValue(new Error(errorMessage));

      const ticker = 'MSFT';
      const fromDate = '2023-01-01';
      const toDate = '2023-01-03';

      await expect(service.getHistoricalData(ticker, fromDate, toDate)).rejects.toThrow(
        `Could not fetch historical data for ${ticker}. Please check the ticker and date range.`
      );

      expect(logger.error).toHaveBeenCalledWith(
        `Error fetching historical data for ${ticker}`,
        expect.objectContaining({ ticker, error: expect.any(Error) })
      );
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

    it('should round close, high, and low prices to 2 decimals', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockChartResult: any = {
        quotes: [
          {
            date: new Date('2023-01-01'),
            close: 100.1234,
            high: 105.5678,
            low: 95.9012,
            volume: 1000000,
          },
        ],
      };

      mockChart.mockResolvedValue(mockChartResult);

      const ticker = 'AAPL';
      const fromDate = '2023-01-01';
      const toDate = '2023-01-01';

      const historicalData = await service.getHistoricalData(ticker, fromDate, toDate);

      expect(historicalData[0]).toEqual({
        date: '2023-01-01',
        close: 100.12,
        high: 105.57,
        low: 95.90,
        volume: 1000000,
      });
    });
  });
});
