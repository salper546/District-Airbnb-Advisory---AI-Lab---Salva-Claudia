import { AmenityComparison, AmenityAdjustmentBreakdown } from '../types';

/**
 * Maps each amenity/feature into an itemized breakdown with confidence disclaimers.
 * Preserves the exact displayText, disclaimer, and standard amenity classifications.
 */
export function buildAmenityBreakdown(
  comparisons: AmenityComparison[],
  selectedAmenities: string[]
): AmenityAdjustmentBreakdown[] {
  return comparisons.map((comp) => {
    const isSelected = selectedAmenities.includes(comp.name);
    const diff = comp.dollarDifference;

    let notes = '';
    if (comp.isStandard) {
      notes = 'Standard amenity: expected by guests, no measurable price premium';
    } else if (comp.confidenceLevel === 'rare') {
      notes = 'Rare in DC: no comparable listings offer this amenity';
    } else if (comp.isSmallDifference) {
      notes = 'No clear price effect (difference within -$10 to +$10)';
    } else if (diff !== null) {
      notes = isSelected
        ? `Offered (${diff > 0 ? `+$${diff}` : `-$${Math.abs(diff)}`}/nt difference)`
        : `Not selected (${diff > 0 ? `+$${diff}` : `-$${Math.abs(diff)}`}/nt difference)`;
    } else {
      notes = comp.disclaimer || '';
    }

    return {
      name: comp.name,
      category: comp.category,
      dollarDifference: comp.dollarDifference,
      impact: isSelected && diff !== null && diff > 10 ? diff : 0,
      percentHas: comp.percentHas,
      countHas: comp.countHas,
      countNotHas: comp.countNotHas,
      medianPriceHas: comp.medianPriceHas,
      medianPriceNotHas: comp.medianPriceNotHas,
      hasEnoughData: comp.hasEnoughData,
      adoptionTier: comp.adoptionTier,
      isApplied: isSelected,
      notes,
      isStandard: comp.isStandard,
      isSmallDifference: comp.isSmallDifference,
      displayText: comp.displayText || '',
      disclaimer: comp.disclaimer || '',
      confidenceLevel: comp.confidenceLevel || 'low-confidence',
      sampleSize: comp.sampleSize ?? (comp.countHas + comp.countNotHas),
    };
  });
}
