// Large feeds may download slowly, so only fail quickly when no data arrives.
const IDLE_TIMEOUT = 10_000;
const TOTAL_TIMEOUT = 60_000;
// Long-running daily shows exceed 20 MB (e.g. The Daily), so leave headroom for growth.
const MAX_FEED_MB = 30;
const MAX_FEED_BYTES = MAX_FEED_MB * 1000 * 1000;
const MAX_RETRIES = 2;
const VALID_CONTENT_TYPES = [
  'application/rss+xml',
  'application/xml',
  'text/xml',
  'application/rdf+xml',
  'application/text',
  'text/plain',
];

class FeedTooLargeError extends Error {
  constructor() {
    super(`Podcast feed is too large (maximum ${MAX_FEED_MB} MB).`);
  }
}

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function readFeed(
  url: string,
  signal: AbortSignal,
  onData: () => void,
  options: RequestInit = {},
): Promise<string> {
  const response = await fetch(url, { ...options, signal });
  const reader = response.body?.getReader();
  // Cancelling the reader also settles a pending read when the body stalls.
  const cancel = () => {
    void reader?.cancel().catch(() => {});
  };
  signal.addEventListener('abort', cancel, { once: true });
  let complete = false;
  try {
    signal.throwIfAborted();
    if (!response.ok) throw new Error('Network response failed');
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
      throw new Error('Invalid content type: Not a valid RSS feed');
    }
    if (!reader) throw new Error('Podcast feed has no response body');

    // Count delivered bytes, including decompressed bodies, without trusting Content-Length.
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      onData();
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new FeedTooLargeError();
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    complete = true;
    const xml = chunks.join('');
    if (
      !/<rss\b[^>]*>/i.test(xml) ||
      !/<channel\b[^>]*>/i.test(xml) ||
      (/<item\b[^>]*>/i.test(xml) && !/<enclosure\b[^>]*>/i.test(xml))
    ) {
      throw new Error('Invalid feed: Not a podcast RSS feed');
    }
    return xml;
  } finally {
    signal.removeEventListener('abort', cancel);
    if (!complete) cancel();
    reader?.releaseLock();
  }
}

export async function fetchPodcastFeed(feedUrl: string, callerSignal: AbortSignal): Promise<string> {
  callerSignal.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(callerSignal.reason);
  callerSignal.addEventListener('abort', cancel, { once: true });
  const abortAfter = (ms: number, message: string) => setTimeout(() => controller.abort(new Error(message)), ms);
  // Both deadlines include headers, body consumption, proxy fallback, and retry delays;
  // only received body data postpones the idle deadline.
  const startIdleTimeout = () =>
    abortAfter(IDLE_TIMEOUT, `Podcast feed did not respond for ${IDLE_TIMEOUT / 1000} seconds.`);
  let idleTimeout = startIdleTimeout();
  const onData = () => {
    clearTimeout(idleTimeout);
    idleTimeout = startIdleTimeout();
  };
  const totalTimeout = abortAfter(
    TOTAL_TIMEOUT,
    `Podcast feed took longer than ${TOTAL_TIMEOUT / 1000} seconds to load.`,
  );
  const { signal } = controller;
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        return await readFeed(feedUrl, signal, onData);
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof FeedTooLargeError) throw error;
      }
      try {
        return await readFeed('https://request.tuner.workers.dev', signal, onData, { method: 'POST', body: feedUrl });
      } catch (error) {
        signal.throwIfAborted();
        if (error instanceof FeedTooLargeError || attempt === MAX_RETRIES) throw error;
        await waitForRetry(1000 * (attempt + 1), signal);
      }
    }
  } finally {
    clearTimeout(idleTimeout);
    clearTimeout(totalTimeout);
    callerSignal.removeEventListener('abort', cancel);
  }
}
