export async function getSignature(fullUrl: string, requestBody: string = ''): Promise<string> {
  let result = '';

  const enc = new TextEncoder();
  const url = new URL(fullUrl);
  const timestamp = Date.now();
  const timestampedPayload = `${timestamp}.${fullUrl.slice(url.protocol.length + 2)}.${requestBody}`;

  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode('RGl0aXMxaGVsZW1vb2lla2V5b20xYWFudnJhYWdhZnRlaGFuZGVsZW4tbW9vaXRvY2g='),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify'],
  );

  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(timestampedPayload));

  const b = new Uint8Array(signature);
  result = Array.prototype.map.call(b, (x) => x.toString(16).padStart(2, '0')).join('');

  return `t=${timestamp},s=${result}`;
}
