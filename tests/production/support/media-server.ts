import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

const SAMPLE_RATE = 8000;
// Small range responses make every seek and buffer refill a new request, like a large real episode.
const MAX_RANGE_BYTES = 64 * 1024;

// An 8-bit mono WAV tone: real media the browser decodes, seeks and plays.
function createWav(seconds: number, frequency: number) {
  const samples = seconds * SAMPLE_RATE;
  const wav = Buffer.alloc(44 + samples);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + samples, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE, 28); // byte rate
  wav.writeUInt16LE(1, 32); // block align
  wav.writeUInt16LE(8, 34); // bits per sample
  wav.write('data', 36);
  wav.writeUInt32LE(samples, 40);
  for (let i = 0; i < samples; i++) {
    wav[44 + i] = 128 + Math.round(40 * Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE));
  }
  return wav;
}

function sendRange(request: IncomingMessage, response: ServerResponse, body: Buffer) {
  const headers = { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '');
  if (!range) {
    response.writeHead(200, { ...headers, 'Content-Length': body.length });
    response.end(body);
    return;
  }
  const start = Number(range[1]);
  if (start >= body.length) {
    response.writeHead(416, { ...headers, 'Content-Range': `bytes */${body.length}` });
    response.end();
    return;
  }
  const requestedEnd = range[2] ? Number(range[2]) : body.length - 1;
  const end = Math.min(requestedEnd, start + MAX_RANGE_BYTES - 1, body.length - 1);
  response.writeHead(206, {
    ...headers,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${body.length}`,
  });
  response.end(body.subarray(start, end + 1));
}

export type MediaServer = Awaited<ReturnType<typeof startMediaServer>>;

/**
 * Serves a podcast episode the way hosts like Substack do: the feed URL redirects to a signed
 * CDN URL, and requests with an expired signature are refused. Radio is served directly.
 */
export async function startMediaServer() {
  const episode = createWav(30 * 60, 440);
  const radio = createWav(30 * 60, 660);
  let signature = 1;
  const log: string[] = [];

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    log.push(`${request.method} ${url.pathname}${url.search} ${request.headers.range ?? ''}`);
    if (url.pathname === '/episode.wav') {
      response.writeHead(307, { Location: `/signed/episode.wav?signature=${signature}`, 'Cache-Control': 'no-cache' });
      response.end();
    } else if (url.pathname === '/signed/episode.wav') {
      if (url.searchParams.get('signature') !== String(signature)) {
        log.push('403 expired signature');
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('Expired');
        return;
      }
      sendRange(request, response, episode);
    } else if (url.pathname === '/radio.wav') {
      sendRange(request, response, radio);
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    episodeUrl: `${origin}/episode.wav`,
    radioUrl: `${origin}/radio.wav`,
    log,
    /** Invalidates every signed URL handed out so far, like a CDN signature expiring. */
    expireSignatures: () => signature++,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
