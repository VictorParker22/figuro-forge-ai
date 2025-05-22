
/**
 * Utility for handling CORS proxies for 3D model loading
 */

// List of available CORS proxies (can be expanded)
const CORS_PROXIES = [
  "https://cors-proxy.fringe.zone/",
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url="
];

/**
 * Adds a CORS proxy to a URL
 * @param url The original URL
 * @param proxyIndex The index of the proxy to use (defaults to 0)
 * @returns The URL with the CORS proxy
 */
export const addCorsProxy = (url: string, proxyIndex: number = 0): string => {
  if (!url) return url;
  
  // Don't add a proxy for blob URLs or data URLs
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Ensure proxy index is valid
  const validIndex = Math.max(0, Math.min(proxyIndex, CORS_PROXIES.length - 1));
  return `${CORS_PROXIES[validIndex]}${encodeURIComponent(url)}`;
};

/**
 * Check if a URL is already a proxied URL
 */
export const isProxiedUrl = (url: string): boolean => {
  if (!url) return false;
  return CORS_PROXIES.some(proxy => url.startsWith(proxy));
};

/**
 * Get the original URL from a proxied URL
 */
export const getOriginalUrl = (proxiedUrl: string): string => {
  if (!proxiedUrl) return proxiedUrl;
  
  // If it's not a proxied URL, return it as is
  if (!isProxiedUrl(proxiedUrl)) return proxiedUrl;
  
  // Find which proxy was used
  const proxy = CORS_PROXIES.find(p => proxiedUrl.startsWith(p));
  if (!proxy) return proxiedUrl;
  
  // Extract and decode the original URL
  const encodedUrl = proxiedUrl.substring(proxy.length);
  try {
    return decodeURIComponent(encodedUrl);
  } catch (e) {
    console.error('Error decoding proxied URL:', e);
    return proxiedUrl;
  }
};

/**
 * Try to load a URL with different CORS proxies
 * @param url The original URL
 * @param onSuccess Callback when successful
 * @param onError Callback when all attempts fail
 */
export const tryLoadWithCorsProxies = async (
  url: string,
  onSuccess: (loadedUrl: string) => void,
  onError: (error: Error) => void
): Promise<void> => {
  if (!url) {
    onError(new Error("No URL provided"));
    return;
  }

  // First try without a proxy
  try {
    console.log("Trying to load URL directly:", url);
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      console.log("Direct URL access succeeded");
      onSuccess(url);
      return;
    }
  } catch (error) {
    console.log("Direct access failed, trying proxies...", error);
  }

  // Try with each proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxiedUrl = addCorsProxy(url, i);
    console.log(`Trying with proxy ${i}:`, proxiedUrl);
    
    try {
      const response = await fetch(proxiedUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Proxy ${i} succeeded`);
        onSuccess(proxiedUrl);
        return;
      }
    } catch (error) {
      console.log(`Proxy ${i} failed:`, error);
    }
  }

  // If all attempts fail, call the error callback
  console.error("All proxy attempts failed");
  onError(new Error("Failed to load URL with all available proxies"));
};

export default {
  addCorsProxy,
  tryLoadWithCorsProxies,
  isProxiedUrl,
  getOriginalUrl
};
