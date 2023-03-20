import { createClient } from 'redis';
import { handler } from '../../src/lambda/index';

jest.mock('redis');

const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  expire: jest.fn(),
  connect: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockRedisClient);

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
    mockRedisClient.get.mockResolvedValue(value);

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ key, value });
  });

  it('should set value and expire in Redis if the value is not present', async () => {
    const key = 'test_key';
    const valueFromRequest = key;
    mockRedisClient.get.mockResolvedValue(null);

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(mockRedisClient.set).toHaveBeenCalledWith(key, valueFromRequest);
    expect(mockRedisClient.expire).toHaveBeenCalledWith(key, 3600);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ key, value: valueFromRequest });
  });

  it('should return a 500 Internal Server Error response if an error occurs', async () => {
    const key = 'test_key';
    mockRedisClient.get.mockRejectedValue(new Error('Test error'));

    const event = { queryStringParameters: { key } };
    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ message: 'Internal Server Error' });
  });
});
