const getQuickReconnectTimes = (maxReconnectAttempts: number) => Math.min(maxReconnectAttempts / 2, 20);

const getReconnectTimeoutMs = (reconnectAttempts: number, maxReconnectAttempts: number) => {
  const quickReconnectTimes = getQuickReconnectTimes(maxReconnectAttempts);
  return reconnectAttempts <= quickReconnectTimes ? 500 : 1000 * Math.min(reconnectAttempts - quickReconnectTimes, 10);
};

export const reconnectUtil = {
  getQuickReconnectTimes,
  getReconnectTimeoutMs: getReconnectTimeoutMs,
};
