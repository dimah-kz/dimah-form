export type NumericAcc = {
  n: number;
  mean: number;
  m2: number;
  min: number;
  max: number;
};

export function createNumericAcc(): NumericAcc {
  return { n: 0, mean: 0, m2: 0, min: 0, max: 0 };
}

export function addNumeric(acc: NumericAcc, value: number): void {
  if (acc.n === 0) {
    acc.min = value;
    acc.max = value;
  } else {
    acc.min = Math.min(acc.min, value);
    acc.max = Math.max(acc.max, value);
  }
  acc.n += 1;
  const delta = value - acc.mean;
  acc.mean += delta / acc.n;
  acc.m2 += delta * (value - acc.mean);
}

export function numericSnapshot(
  acc: NumericAcc,
): { min: number; max: number; mean: number; stdev: number } | undefined {
  if (acc.n === 0) return undefined;
  return {
    min: acc.min,
    max: acc.max,
    mean: acc.mean,
    stdev: acc.n > 1 ? Math.sqrt(acc.m2 / (acc.n - 1)) : 0,
  };
}
