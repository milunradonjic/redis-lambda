import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient> & { connected?: boolean };
type Event = Record<string, any>;
type Response = { statusCode: number; body: string }

export const client: RedisClient = createClient({
  url: process.env.CACHE_URL,
});


/**
 * Lambda function handler
 *
 * This function processes the incoming event object, retrieves the key
 * from the event object (either from queryStringParameters or the event object itself),
 * and performs the following steps:
 * 1. Attempts to get the value associated with the provided key from Redis.
 * 2. If the value is not found in Redis:
 *    - Stores the value from the request (or an empty string if no value is provided) in Redis with the given key.
 *    - Sets a TTL of 1 hour for the key-value pair in Redis.
 * 3. Returns the key and value as part of the response object.
 *
 * If the key parameter is not provided, the function returns a 400 Bad Request response with an error message.
 * If an error occurs while processing the request, the function logs the error and returns a 500 Internal Server Error response.
 *
 * @param {Event} event - The incoming event object
 * @returns {Promise<Response>} The response object
 */
export async function handler(event: Event): Promise<Response> {
  console.debug('Event', { event });

  if (!client.connected) {
    await client.connect();
    client.connected = true;
  }
  // Retrieve the 'key' value from either the queryStringParameters or the event object itself.
  // We also set 'valueFromRequest' to the same value as 'key', treating the key as the default value.
  const key = event.queryStringParameters?.key || event?.key;
  const valueFromRequest = key;

  if (!key) {
    console.error('Key parameter is missing');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Key parameter is missing' }),
    };
  }

  try {
    console.debug('Get by key', key);
    let value = await client.get(key);
    if (value === null) {
      console.debug('Value not found. Setting it.');
      value = valueFromRequest;
      await client.set(key, valueFromRequest);
      await client.expire(key, 3600);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ key, value }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
