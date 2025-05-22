
/**
 * Utility for handling CORS proxies for 3D model loading
 */

// List of available CORS proxies (can be expanded)
const CORS_PROXIES = [
  "https://cors-proxy.fringe.zone/",
  "https://corsproxy.io/?",
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
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      onSuccess(url);
      return;
    }
  } catch (error) {
    console.log("Direct access failed, trying proxies...");
  }

  // Try with each proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxiedUrl = addCorsProxy(url, i);
    try {
      const response = await fetch(proxiedUrl, { method: 'HEAD' });
      if (response.ok) {
        onSuccess(proxiedUrl);
        return;
      }
    } catch (error) {
      console.log(`Proxy ${i} failed:`, error);
    }
  }

  // If all attempts fail, call the error callback
  onError(new Error("Failed to load URL with all available proxies"));
};

export default {
  addCorsProxy,
  tryLoadWithCorsProxies,
};
