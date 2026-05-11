
export type WeightUnit = 'kg' | 'lbs';

export const KG_TO_LBS = 2.20462;

export function getWeightUnit(): WeightUnit {
  if (typeof window === 'undefined') return 'kg';
  const saved = localStorage.getItem('weightUnit');
  return (saved === 'lbs') ? 'lbs' : 'kg';
}

/**
 * Converts internal kg to display weight (either kg or lbs)
 */
export function convertWeight(kg: number, targetUnit?: WeightUnit): number {
  const unit = targetUnit || getWeightUnit();
  if (unit === 'kg') return kg;
  return kg * KG_TO_LBS;
}

/**
 * Converts user-input weight to internal kg
 */
export function toInternalWeight(weight: number, sourceUnit?: WeightUnit): number {
  const unit = sourceUnit || getWeightUnit();
  if (unit === 'kg') return weight;
  return weight / KG_TO_LBS;
}

/**
 * Formats weight for display with unit suffix
 */
export function displayWeight(kg: number, precision: number = 1): string {
  const unit = getWeightUnit();
  const value = convertWeight(kg, unit);
  
  // If it's a whole number or very close, show no decimals
  if (Math.abs(value - Math.round(value)) < 0.01) {
    return `${Math.round(value)} ${unit}`;
  }
  
  return `${value.toFixed(precision)} ${unit}`;
}

/**
 * Just the unit suffix
 */
export function getWeightSuffix(): string {
  return getWeightUnit();
}
