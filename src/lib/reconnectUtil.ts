const getQuickReconnectTimes = (maxReconnectAttempts: number) => Math.min(maxReconnectAttempts / 2, 20);

const getReconnectTimeoutMs = (reconnectAttempts: number, maxReconnectAttempts: number) => {
  const quickReconnectTimes = getQuickReconnectTimes(maxReconnectAttempts);
  return reconnectAttempts <= quickReconnectTimes ? 500 : 1000 * Math.min(reconnectAttempts - quickReconnectTimes, 10);
};

// A unique URL makes the browser start a new request instead of reusing a failed or redirected one.
const withCacheBuster = (url: string) => `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

export const reconnectUtil = {
  getQuickReconnectTimes,
  getReconnectTimeoutMs: getReconnectTimeoutMs,
  withCacheBuster,
};
