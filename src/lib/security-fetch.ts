import dns from 'dns/promises';
import { URL } from 'url';

const isPrivateIP = (ip: string) => {
  // IPv4 Private Address Space and Loopback
  if (/^(?:10|127|169\.254|192\.168)\..*/.test(ip)) return true;
  if (/^172\.(?:1[6-9]|2[0-9]|3[0-1])\..*/.test(ip)) return true;
  // IPv6 Loopback and Unique Local
  if (/^(?:::1|fc00:|fd00:)/i.test(ip)) return true;
  // AWS Metadata Server
  if (ip === '169.254.169.254') return true;
  return false;
};

export interface SecureFetchOptions extends RequestInit {
  maxRedirects?: number;
  maxSizeBytes?: number;
}

export const secureFetch = async (
  targetUrl: string,
  options: SecureFetchOptions = {}
): Promise<Response> => {
  let currentUrl = targetUrl;
  let redirects = 0;
  const maxRedirects = options.maxRedirects ?? 3;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB default limit

  while (redirects <= maxRedirects) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      throw new Error(`Invalid URL: ${currentUrl}`);
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
    }

    // Resolve DNS to check IP before connecting
    try {
      const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateIP(addr.address)) {
          throw new Error(`SSRF Blocked: URL resolves to private IP (${addr.address})`);
        }
      }
    } catch (e: any) {
      if (e.message.includes('SSRF Blocked')) throw e;
      // If DNS resolution fails, let fetch handle it or throw
      throw new Error(`Failed to resolve hostname: ${parsedUrl.hostname}`);
    }

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual', // We handle redirects manually for safety
    });

    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      const location = response.headers.get('location')!;
      currentUrl = new URL(location, currentUrl).toString();
      redirects++;
      if (redirects > maxRedirects) {
        throw new Error('Too many redirects');
      }
      continue;
    }

    // Check Content-Length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`File too large: exceeds ${maxSizeBytes} bytes`);
    }

    return response;
  }

  throw new Error('Too many redirects');
};

/**
 * Downloads a URL safely into an ArrayBuffer, enforcing memory limits.
 */
export const secureFetchBuffer = async (
  targetUrl: string,
  options: SecureFetchOptions = {}
): Promise<{ buffer: Buffer; contentType: string }> => {
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024;
  const response = await secureFetch(targetUrl, options);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  
  // Read chunk by chunk to prevent memory exhaustion from falsely low content-length
  const reader = response.body?.getReader();
  if (!reader) {
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxSizeBytes) throw new Error('File too large');
    return { buffer: Buffer.from(arrayBuffer), contentType };
  }

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      receivedLength += value.length;
      if (receivedLength > maxSizeBytes) {
        throw new Error(`File too large: exceeds ${maxSizeBytes} bytes`);
      }
      chunks.push(value);
    }
  }

  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return { buffer: Buffer.from(allChunks.buffer), contentType };
};
