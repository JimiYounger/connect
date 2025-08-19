// Mock @mux/mux-node
jest.mock('@mux/mux-node', () => {
  return jest.fn().mockImplementation(() => ({
    video: {
      liveStreams: {
        retrieve: jest.fn(),
      },
    },
  }));
});

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    MUX_TOKEN_ID: 'test-token-id',
    MUX_TOKEN_SECRET: 'test-token-secret',
    MUX_STREAM_ID: 'test-stream-id',
    MUX_PLAYBACK_ID: 'test-playback-id',
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('getLiveStatus', () => {
  it('should return isLive: true when stream status is active', async () => {
    // Mock the mux client's retrieve method
    const mockRetrieve = jest.fn().mockResolvedValue({
      status: 'active',
    });

    // Re-import to get the mocked version
    jest.doMock('../muxClient', () => ({
      muxClient: {
        video: {
          liveStreams: {
            retrieve: mockRetrieve,
          },
        },
      },
    }));

    const { getLiveStatus } = await import('../getLiveStatus');
    const result = await getLiveStatus();

    expect(result).toEqual({
      isLive: true,
      playbackId: 'test-playback-id',
    });
    expect(mockRetrieve).toHaveBeenCalledWith('test-stream-id');
  });

  it('should return isLive: false when stream status is idle', async () => {
    // Mock the mux client's retrieve method
    const mockRetrieve = jest.fn().mockResolvedValue({
      status: 'idle',
    });

    jest.doMock('../muxClient', () => ({
      muxClient: {
        video: {
          liveStreams: {
            retrieve: mockRetrieve,
          },
        },
      },
    }));

    const { getLiveStatus } = await import('../getLiveStatus');
    const result = await getLiveStatus();

    expect(result).toEqual({
      isLive: false,
      playbackId: 'test-playback-id',
    });
    expect(mockRetrieve).toHaveBeenCalledWith('test-stream-id');
  });

  it('should return isLive: false when an error occurs', async () => {
    // Mock the mux client's retrieve method to throw an error
    const mockRetrieve = jest.fn().mockRejectedValue(new Error('API Error'));

    jest.doMock('../muxClient', () => ({
      muxClient: {
        video: {
          liveStreams: {
            retrieve: mockRetrieve,
          },
        },
      },
    }));

    // Spy on console.error to verify error logging
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getLiveStatus } = await import('../getLiveStatus');
    const result = await getLiveStatus();

    expect(result).toEqual({
      isLive: false,
      playbackId: 'test-playback-id',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error retrieving live stream status:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should use correct environment variables', async () => {
    const mockRetrieve = jest.fn().mockResolvedValue({
      status: 'active',
    });

    jest.doMock('../muxClient', () => ({
      muxClient: {
        video: {
          liveStreams: {
            retrieve: mockRetrieve,
          },
        },
      },
    }));

    const { getLiveStatus } = await import('../getLiveStatus');
    await getLiveStatus();

    expect(mockRetrieve).toHaveBeenCalledWith('test-stream-id');
  });
}); 