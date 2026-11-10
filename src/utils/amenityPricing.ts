import { AmenityComparison, AmenityAdjustmentBreakdown } from '../types';

/**
 * Derives the empirical price adjustments based on the homeowner's selected amenities
 * using the exact user-specified formula:
 * Price Impact = (1 - %adoption) * median price increase
 *
 * For high-adoption amenities (e.g., Wifi at 99%), (1 - 0.99) = 1%, adding only a marginal impact ($1).
 * For rare/differentiating amenities (e.g., Pool at 6%), (1 - 0.06) = 94%, commanding a substantial price impact ($66).
 */
export function calculateAmenityAdjustments(
  tabComparisons: AmenityComparison[],
  selectedAmenities: string[]
): {
  netAdjustment: number;
  appliedAdjustments: AmenityAdjustmentBreakdown[];
} {
  let netAdjustment = 0;
  const appliedAdjustments: AmenityAdjustmentBreakdown[] = [];

  for (const comp of tabComparisons) {
    const isSelected = selectedAmenities.includes(comp.name);
    const diff = comp.dollarDifference;
    const hasValidDiff = diff !== null && comp.hasEnoughData;
    const adoptionPct = comp.percentHas; // e.g. 0.99 for 99%
    const rarityMultiplier = Math.max(1 - adoptionPct, 0); // (1 - %adoption)

    // Calculate raw potential impact: (1 - %adoption) * median price increase
    const potentialImpact =
      hasValidDiff && diff > 0 ? Math.round(rarityMultiplier * diff) : 0;

    const actualImpact = isSelected ? potentialImpact : 0;

    if (isSelected && potentialImpact > 0) {
      netAdjustment += actualImpact;
    }

    const pctDisplay = Math.round(adoptionPct * 100);
    const rarityDisplay = Math.round(rarityMultiplier * 100);

    let notes = '';
    if (isSelected) {
      if (hasValidDiff && diff > 0) {
        notes = `(${rarityDisplay}% rarity multiplier) × $${Math.round(diff)} median increase = +$${actualImpact}/nt`;
      } else if (hasValidDiff && diff <= 0) {
        notes = `No positive median premium detected in current DC data ($0/nt)`;
      } else {
        notes = `Insufficient sample data to calculate reliable premium`;
      }
    } else {
      notes = `Not selected for this property (potential: +$${potentialImpact}/nt)`;
    }

    appliedAdjustments.push({
      name: comp.name,
      category: comp.category,
      dollarDifference: hasValidDiff ? Math.round(diff) : 0,
      impact: potentialImpact,
      percentHas: comp.percentHas,
      adoptionTier: comp.adoptionTier,
      isApplied: isSelected,
      notes,
    });
  }

  return { netAdjustment, appliedAdjustments };
}
