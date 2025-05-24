// lib/utils/debounce.ts

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  //console.log('[debounce] Debounce initialized with delay:', delay);

  return (...args: Parameters<T>) => {
    //console.log('[debounce] Debounced function called with args:', args);

    clearTimeout(timeout);
    //console.log('[debounce] Cleared existing timeout');

    timeout = setTimeout(() => {
      //console.log('[debounce] Timeout triggered, executing function');
      func(...args);
    }, delay);

    //console.log('[debounce] New timeout set for', delay, 'ms');
  };
}
