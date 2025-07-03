// src/__tests__/models/db.spec.js
jest.useFakeTimers();              // control timers for promise resolution
jest.spyOn(global.console, 'log').mockImplementation(() => {});
jest.spyOn(global.console, 'error').mockImplementation(() => {});

// 1) Mock the pg Client
const mockConnect = jest.fn().mockResolvedValue();
const mockQuery   = jest.fn().mockResolvedValue({ rows: [{ version: 'PostgreSQL 13.4' }] });
const mockEnd     = jest.fn().mockResolvedValue();

jest.mock('pg', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      connect: mockConnect,
      query:   mockQuery,
      end:     mockEnd,
    })),
  };
});

describe('models/db', () => {
  let client;

  beforeAll(() => {
    // delay requiring the module until after pg is mocked
    client = require('../../models/db');
  });

  it('should call connect() and query("SELECT version();") on import', async () => {
    // Fast-forward all pending timers (i.e. promise `.then()` callbacks)
    await jest.runAllTimersAsync();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('SELECT version();');

    // console.log for successful connection
    expect(console.log).toHaveBeenCalledWith('Connected to PostgreSQL successfully!');
    expect(console.log).toHaveBeenCalledWith(
      'PostgreSQL version:',
      { version: 'PostgreSQL 13.4' }
    );
  });

  it('exports the same client instance', () => {
    // require('../../models/db') returns our mocked client
    expect(client).toEqual(expect.objectContaining({
      connect: expect.any(Function),
      query:   expect.any(Function),
      end:     expect.any(Function),
    }));
  });

  describe('SIGINT handler', () => {
    let originalExit;

    beforeAll(() => {
      // spy on process.exit so it doesn't actually terminate the test runner
      originalExit = process.exit;
      process.exit = jest.fn();
    });

    afterAll(() => {
      process.exit = originalExit;
    });

    it('should call client.end() and process.exit() on SIGINT', async () => {
      // emit the signal
      process.emit('SIGINT');

      // allow the async handler to run
      await Promise.resolve();

      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Database connection closed gracefully.');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});

describe('models/db connection error', () => {
  let consoleError;

  beforeAll(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it('logs error when client.connect() rejects', async () => {
    jest.resetModules();
    // Mock pg.Client.connect to reject
    jest.mock('pg', () => ({
      Client: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockRejectedValue(new Error('oh no')),
        query:   jest.fn(),
        end:     jest.fn(),
      })),
    }));

    // Re-require under isolation so our mock takes effect
    jest.isolateModules(() => {
      require('../../models/db');
    });

    // Let the promise chain execute
    await jest.runAllTimersAsync();

    expect(consoleError).toHaveBeenCalledWith(
      'Connection error:',
      expect.any(String)
    );
  });
});

