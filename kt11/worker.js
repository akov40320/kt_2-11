/**
 * Worker: считает количество простых до N (достаточно тяжёлая задача).
 * Периодически отправляет прогресс.
 */

function isPrime(x) {
  if (x < 2) return false;
  if (x % 2 === 0) return x === 2;
  const r = Math.floor(Math.sqrt(x));
  for (let d = 3; d <= r; d += 2) {
    if (x % d === 0) return false;
  }
  return true;
}

let cancelled = false;

self.onmessage = (e) => {
  const { type, n } = e.data || {};
  if (type === "cancel") {
    cancelled = true;
    return;
  }
  if (type !== "start") return;

  cancelled = false;
  const N = Number(n) || 0;

  let count = 0;
  const t0 = Date.now();

  for (let i = 2; i <= N; i++) {
    if (cancelled) {
      self.postMessage({ type: "cancelled" });
      return;
    }
    if (isPrime(i)) count++;

    if (i % 5000 === 0) {
      self.postMessage({ type: "progress", i, N, count });
    }
  }

  const ms = Date.now() - t0;
  self.postMessage({ type: "done", N, count, ms });
};
