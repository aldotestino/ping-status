export function calculatePercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? 0;
  return Math.round(lowerValue * (1 - weight) + upperValue * weight);
}

export function calculatePercentageChange(current: number, previous: number) {
  if (!previous || previous === 0) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}
