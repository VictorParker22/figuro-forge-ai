
import { useEffect, useRef, useState } from "react";

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean; // Add option to disconnect after first intersection
}

/**
 * Custom hook for detecting when an element intersects with the viewport
 */
export const useIntersectionObserver = (
  options: IntersectionObserverOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [wasEverVisible, setWasEverVisible] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // Clean up any previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(([entry]) => {
      const isCurrentlyIntersecting = entry.isIntersecting;
      setIsIntersecting(isCurrentlyIntersecting);
      
      if (isCurrentlyIntersecting && !wasEverVisible) {
        setWasEverVisible(true);
        
        // If once option is set, disconnect after first intersection
        if (options.once) {
          observerRef.current?.disconnect();
        }
      }
    }, {
      root: options.root || null,
      rootMargin: options.rootMargin || "0px",
      threshold: options.threshold || 0
    });

    observer.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [options.root, options.rootMargin, options.threshold, options.once, wasEverVisible]);

  return { targetRef, isIntersecting, wasEverVisible };
};
