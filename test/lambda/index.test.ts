import { client, handler } from '../../src/lambda/index';

jest.mock('redis', () => {
  return {
    createClient: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      expire: jest.fn(),
      connect: jest.fn(),
      connected: false,
    })),
  };
});

const mockGet = client.get as jest.Mock;
const mockSet = client.set as jest.Mock;
const mockExpire = client.expire as jest.Mock;
const mockConnect = client.connect as jest.Mock;

describe('handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a 400 Bad Request response if the key is missing', async () => {
    const event = {};
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: 'Key parameter is missing' });
  });

  it('should get value from Redis and return a 200 OK response if the key is present', async () => {
    const key = 'test_key';
    const value = 'test_value';
    mockGet.mockResolvedValue(value);

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(mockGet).toHaveBeenCalledWith(key);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ key, value });
  });

  it('should set value and expire in Redis if the value is not present', async () => {
    const key = 'test_key';
    const valueFromRequest = key;
    mockGet.mockResolvedValue(null);

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(mockGet).toHaveBeenCalledWith(key);
    expect(mockSet).toHaveBeenCalledWith(key, valueFromRequest);
    expect(mockExpire).toHaveBeenCalledWith(key, 3600);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ key, value: valueFromRequest });
  });

  it('should connect to Redis if not connected', async () => {
    const key = 'test_key';
    const value = 'test_value';
    mockGet.mockResolvedValue(value);
    client.connected = false;

    const event = { queryStringParameters: { key } };
    await handler(event);

    expect(mockConnect).toHaveBeenCalled();
  });

  it('should not connect to Redis if already connected', async () => {
    const key = 'test_key';
    const value = 'test_value';
    mockGet.mockResolvedValue(value);
    client.connected = true;

    const event = { queryStringParameters: { key } };
    await handler(event);

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('should return a 500 Internal Server Error if an error occurs', async () => {
    const key = 'test_key';
    mockGet.mockRejectedValue(new Error('Test error'));

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ message: 'Internal Server Error' });
  });
});
