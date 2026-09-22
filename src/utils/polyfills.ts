/**
 * Critical runtime polyfills for maximum mobile browser compatibility
 * (Mobile Safari iOS 14-17, Android Chrome & WebViews)
 */

// 1. Promise.withResolvers (Required by pdfjs-dist v4+; absent in Safari < 17.4 & older mobile WebViews)
if (typeof Promise !== 'undefined' && typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// 2. structuredClone fallback for older mobile browsers
if (typeof globalThis !== 'undefined' && typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function <T>(obj: T): T {
    if (obj === undefined) return undefined as any;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  };
}

// 3. Array.prototype.at fallback for older mobile engines
if (typeof Array !== 'undefined' && !Array.prototype.at) {
  Array.prototype.at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// 4. Safe mediaDevices stub for non-secure / restricted mobile contexts
if (typeof window !== 'undefined' && window.navigator) {
  if (!window.navigator.mediaDevices) {
    (window.navigator as any).mediaDevices = {
      enumerateDevices: async () => [],
      getUserMedia: async () => {
        throw new Error('Kamera tidak didukung pada browser ini atau membutuhkan koneksi HTTPS.');
      },
    };
  }
}

// 5. Suppress benign ResizeObserver notifications that cause unhandled rejections on mobile
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event?.message && (
      event.message.includes('ResizeObserver loop') ||
      event.message.includes('ResizeObserver completed with undelivered notifications')
    )) {
      event.stopImmediatePropagation();
    }
  });
}

export {};
