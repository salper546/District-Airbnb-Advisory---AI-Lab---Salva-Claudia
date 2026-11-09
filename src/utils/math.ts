/**
 * Mathematical utilities adhering to exact Excel PERCENTILE.INC linear interpolation rules.
 * PERCENTILE.INC(array, p):
 * For sorted 0-indexed array A of length N:
 * k = p * (N - 1)
 * i = floor(k)
 * f = k - i
 * value = A[i] + f * (A[i+1] - A[i])
 */

export function calculatePercentile(values: number[], p: number): number | null {
  if (!values || values.length === 0) return null;
  const filtered = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 1) return sorted[0];

  const k = p * (n - 1);
  const i = Math.floor(k);
  const f = k - i;

  if (i >= n - 1) return sorted[n - 1];
  if (i < 0) return sorted[0];

  return sorted[i] + f * (sorted[i + 1] - sorted[i]);
}

export function calculateMedian(values: number[]): number | null {
  return calculatePercentile(values, 0.5);
}

export function calculateP25(values: number[]): number | null {
  return calculatePercentile(values, 0.25);
}

export function calculateP75(values: number[]): number | null {
  return calculatePercentile(values, 0.75);
}

export function formatCurrency(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}
