// Older mobile browsers do not implement Promise.withResolvers yet.
// PDF.js uses it while reading PDF files, so install the small ES2024 polyfill
// before the application modules are evaluated.
const promiseConstructor = Promise as PromiseConstructor & {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};

if (typeof promiseConstructor.withResolvers !== "function") {
  promiseConstructor.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
