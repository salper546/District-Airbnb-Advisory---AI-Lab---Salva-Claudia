import { AmenityComparison, Listing } from '../types';
import { calculateMedian, calculateP25, calculateP75 } from './math';

export function parseAmenities(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim());
    }
  } catch {
    // Fallback if not valid JSON
  }
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, ''))
    .filter(Boolean);
}

export const AMENITY_DEFINITIONS: {
  name: string;
  category: 'Amenity';
  matchItem: (item: string) => boolean;
}[] = [
  { name: 'Wifi', category: 'Amenity', matchItem: (item) => item.toLowerCase().includes('wifi') },
  { name: 'Kitchen', category: 'Amenity', matchItem: (item) => item.toLowerCase().includes('kitchen') },
  {
    name: 'Washer',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return lower.includes('washer') && !lower.includes('dishwasher');
    },
  },
  {
    name: 'Dryer',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return lower.includes('dryer') && !lower.includes('hair dryer');
    },
  },
  {
    name: 'Air conditioning',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return (
        lower.includes('air conditioning') ||
        lower.includes('central air') ||
        lower.includes('ac unit')
      );
    },
  },
  {
    name: 'Free parking',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return (
        (lower.includes('free parking') || lower.includes('free driveway parking')) &&
        !lower.includes('free street parking') &&
        !lower.includes('street')
      );
    },
  },
  {
    name: 'Dedicated workspace',
    category: 'Amenity',
    matchItem: (item) => item.toLowerCase().includes('dedicated workspace'),
  },
  {
    name: 'Pool',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return (
        lower.includes('pool') &&
        !lower.includes('pool table') &&
        !lower.includes('whirlpool')
      );
    },
  },
  {
    name: 'Gym',
    category: 'Amenity',
    matchItem: (item) => item.toLowerCase().includes('gym'),
  },
  {
    name: 'Self check-in',
    category: 'Amenity',
    matchItem: (item) => {
      const lower = item.toLowerCase();
      return (
        lower.includes('self check-in') ||
        lower.includes('smart lock') ||
        lower.includes('keypad')
      );
    },
  },
  { name: 'Pets allowed', category: 'Amenity', matchItem: (item) => item.toLowerCase().includes('pets allowed') },
  { name: 'Dishwasher', category: 'Amenity', matchItem: (item) => item.toLowerCase().includes('dishwasher') },
];

export const FEATURE_DEFINITIONS: {
  name: string;
  category: 'Feature';
  test: (listing: Listing) => boolean;
}[] = [
  { name: 'Superhost', category: 'Feature', test: (r) => r.host_is_superhost === 't' },
  {
    name: 'Review score ≥ 4.8',
    category: 'Feature',
    test: (r) => r.review_scores_rating !== null && r.review_scores_rating >= 4.8,
  },
  {
    name: 'Min. stay ≤ 2 nights',
    category: 'Feature',
    test: (r) => r.minimum_nights !== null && r.minimum_nights <= 2,
  },
];

export const ALL_ITEMS_ORDER: { name: string; category: 'Amenity' | 'Feature' }[] = [
  ...AMENITY_DEFINITIONS.map((a) => ({ name: a.name, category: a.category })),
  ...FEATURE_DEFINITIONS.map((f) => ({ name: f.name, category: f.category })),
];

export function listingHasItem(
  listing: Listing,
  parsedAmenities: string[],
  name: string
): boolean {
  const feat = FEATURE_DEFINITIONS.find((f) => f.name === name);
  if (feat) {
    return feat.test(listing);
  }

  const amen = AMENITY_DEFINITIONS.find((a) => a.name === name);
  if (amen) {
    return parsedAmenities.some((i) => amen.matchItem(i));
  }

  // Generic fallback
  return parsedAmenities.some((i) => i.toLowerCase().includes(name.toLowerCase()));
}

export function listingHasAllSelected(
  listing: Listing,
  parsedAmenities: string[],
  selectedAmenities: string[]
): boolean {
  if (selectedAmenities.length === 0) return true;
  return selectedAmenities.every((a) => listingHasItem(listing, parsedAmenities, a));
}

/**
 * Requirements 2, 3, and 4:
 * The amenity cards use this fallback order with confidence disclaimers (never show "Not enough data"):
 * 1. Neighborhood comparables, if each group has >= 10 listings: "Based on X listings in [neighborhood]"
 * 2. Otherwise, all of DC with same filters, if each group has >= 10: "Few listings in this neighborhood. Estimate based on X similar listings across DC"
 * 3. Otherwise, use listings that exist, however few: "Low confidence: based on only X listings. Use as a rough guide"
 * 4. Only if no listing in DC has the amenity: "Rare in DC: no comparable listings offer this amenity", without a number.
 *
 * For Kitchen and Wifi: show "Standard amenity: expected by guests, no measurable price premium" (no price difference).
 * For other amenities, if difference is between -$10 and +$10, show "No clear price effect" instead of the number.
 */
export function computeComparableAmenityComparisons(
  comparableListings: Listing[],
  categoryListings: Listing[],
  allDcListings: Listing[],
  neighborhoodName: string
): AmenityComparison[] {
  const parsedComps = comparableListings.map((r) => ({
    listing: r,
    items: parseAmenities(r.amenities),
  }));

  const parsedCategory = categoryListings.map((r) => ({
    listing: r,
    items: parseAmenities(r.amenities),
  }));

  const parsedAllDc = allDcListings.map((r) => ({
    listing: r,
    items: parseAmenities(r.amenities),
  }));

  const results: AmenityComparison[] = [];

  for (const itemDef of ALL_ITEMS_ORDER) {
    // Requirement 3: Kitchen & Wifi standard amenities
    const isStandard = itemDef.name === 'Wifi' || itemDef.name === 'Kitchen';

    // 1. Group within neighborhood comparables
    const neighHas: number[] = [];
    const neighNotHas: number[] = [];
    for (const entry of parsedComps) {
      if (entry.listing.price === null || isNaN(entry.listing.price)) continue;
      if (listingHasItem(entry.listing, entry.items, itemDef.name)) {
        neighHas.push(entry.listing.price);
      } else {
        neighNotHas.push(entry.listing.price);
      }
    }

    const countHas = neighHas.length;
    const countNotHas = neighNotHas.length;
    const totalCount = countHas + countNotHas;
    const percentHas = totalCount > 0 ? countHas / totalCount : 0;
    const percentNotHas = totalCount > 0 ? countNotHas / totalCount : 0;

    let adoptionTier: 'Must-Have' | 'Common' | 'Optional' = 'Optional';
    if (percentHas >= 0.8) {
      adoptionTier = 'Must-Have';
    } else if (percentHas >= 0.4) {
      adoptionTier = 'Common';
    } else {
      adoptionTier = 'Optional';
    }

    if (isStandard) {
      results.push({
        name: itemDef.name,
        category: itemDef.category,
        countHas,
        countNotHas,
        percentHas,
        percentNotHas,
        medianPriceHas: calculateMedian(neighHas),
        medianPriceNotHas: calculateMedian(neighNotHas),
        dollarDifference: null,
        hasEnoughData: true,
        adoptionTier,
        isStandard: true,
        isSmallDifference: false,
        displayText: 'Standard amenity: expected by guests, no measurable price premium',
        disclaimer: `Expected by guests in ${neighborhoodName}`,
        confidenceLevel: 'standard',
        sampleSize: totalCount,
      });
      continue;
    }

    // Non-standard amenity fallback evaluation
    let diff: number | null = null;
    let confidenceLevel: 'neighborhood' | 'dc-category' | 'low-confidence' | 'rare' = 'neighborhood';
    let disclaimer = '';
    let sampleSize = 0;
    let medianHasToReport = calculateMedian(neighHas);
    let medianNotHasToReport = calculateMedian(neighNotHas);

    // Level 1: Neighborhood comparables (both groups >= 10)
    if (neighHas.length >= 10 && neighNotHas.length >= 10) {
      const medHas = calculateMedian(neighHas);
      const medNotHas = calculateMedian(neighNotHas);
      diff = medHas !== null && medNotHas !== null ? Math.round(medHas - medNotHas) : null;
      sampleSize = neighHas.length + neighNotHas.length;
      confidenceLevel = 'neighborhood';
      disclaimer = `Based on ${sampleSize} listings in ${neighborhoodName}`;
    } else {
      // Level 2: All of DC with same filters (both groups >= 10)
      const dcHas: number[] = [];
      const dcNotHas: number[] = [];
      for (const entry of parsedCategory) {
        if (entry.listing.price === null || isNaN(entry.listing.price)) continue;
        if (listingHasItem(entry.listing, entry.items, itemDef.name)) {
          dcHas.push(entry.listing.price);
        } else {
          dcNotHas.push(entry.listing.price);
        }
      }

      if (dcHas.length >= 10 && dcNotHas.length >= 10) {
        const medHas = calculateMedian(dcHas);
        const medNotHas = calculateMedian(dcNotHas);
        diff = medHas !== null && medNotHas !== null ? Math.round(medHas - medNotHas) : null;
        sampleSize = dcHas.length + dcNotHas.length;
        confidenceLevel = 'dc-category';
        disclaimer = `Few listings in this neighborhood. Estimate based on ${sampleSize} similar listings across DC`;
        if (medianHasToReport === null) medianHasToReport = medHas;
        if (medianNotHasToReport === null) medianNotHasToReport = medNotHas;
      } else {
        // Level 3: Use listings that exist, however few
        // Check if any listings in DC offer this amenity
        const allDcHas: number[] = [];
        const allDcNotHas: number[] = [];
        for (const entry of parsedAllDc) {
          if (entry.listing.price === null || isNaN(entry.listing.price)) continue;
          if (listingHasItem(entry.listing, entry.items, itemDef.name)) {
            allDcHas.push(entry.listing.price);
          } else {
            allDcNotHas.push(entry.listing.price);
          }
        }

        if (dcHas.length > 0 && dcNotHas.length > 0) {
          const medHas = calculateMedian(dcHas);
          const medNotHas = calculateMedian(dcNotHas);
          diff = medHas !== null && medNotHas !== null ? Math.round(medHas - medNotHas) : null;
          sampleSize = dcHas.length + dcNotHas.length;
          confidenceLevel = 'low-confidence';
          disclaimer = `Low confidence: based on only ${sampleSize} listings. Use as a rough guide`;
          if (medianHasToReport === null) medianHasToReport = medHas;
          if (medianNotHasToReport === null) medianNotHasToReport = medNotHas;
        } else if (allDcHas.length > 0 && allDcNotHas.length > 0) {
          const medHas = calculateMedian(allDcHas);
          const medNotHas = calculateMedian(allDcNotHas);
          diff = medHas !== null && medNotHas !== null ? Math.round(medHas - medNotHas) : null;
          sampleSize = allDcHas.length + allDcNotHas.length;
          confidenceLevel = 'low-confidence';
          disclaimer = `Low confidence: based on only ${sampleSize} listings. Use as a rough guide`;
          if (medianHasToReport === null) medianHasToReport = medHas;
          if (medianNotHasToReport === null) medianNotHasToReport = medNotHas;
        } else {
          // Level 4: Rare in DC (no listing has the amenity)
          confidenceLevel = 'rare';
          diff = null;
          disclaimer = 'Rare in DC: no comparable listings offer this amenity';
          sampleSize = 0;
        }
      }
    }

    // Requirement 4: Small differences between -$10 and +$10
    let isSmallDiff = false;
    let displayText = '';

    if (confidenceLevel === 'rare') {
      displayText = 'Rare in DC: no comparable listings offer this amenity';
    } else if (diff !== null) {
      if (diff >= -10 && diff <= 10) {
        isSmallDiff = true;
        displayText = 'No clear price effect';
      } else {
        isSmallDiff = false;
        displayText = diff > 0 ? `+${diff}/nt` : `-${Math.abs(diff)}/nt`;
      }
    } else {
      displayText = 'No clear price effect';
    }

    results.push({
      name: itemDef.name,
      category: itemDef.category,
      countHas,
      countNotHas,
      percentHas,
      percentNotHas,
      medianPriceHas: medianHasToReport,
      medianPriceNotHas: medianNotHasToReport,
      dollarDifference: diff,
      hasEnoughData: confidenceLevel !== 'rare',
      adoptionTier,
      isStandard: false,
      isSmallDifference: isSmallDiff,
      displayText,
      disclaimer,
      confidenceLevel,
      sampleSize,
    });
  }

  return results;
}

/**
 * Computes the amenity-adjusted price following Requirement 2, 3, and 4:
 * Excludes Wifi & Kitchen (standard amenities).
 * Fallback hierarchy:
 * 1. Neighborhood comparables with >= 10 matching listings
 * 2. DC-wide similar listings with >= 10 matching: (DC median matching) x (neighborhood median / DC median)
 * 3. Low confidence: however few listings exist in DC
 * 4. Rare in DC: no listings have the selected amenities
 */
export function computeAmenityAdjustedPrice(
  comparableListings: Listing[],
  categoryListings: Listing[],
  allDcListings: Listing[],
  neighborhoodName: string,
  selectedAmenities: string[]
): {
  adjustedPrice: number | null;
  calculatedAdjustment: number;
  adjustedP25: number | null;
  adjustedP75: number | null;
  pricingConfidenceLevel: 'neighborhood' | 'dc-category' | 'low-confidence' | 'rare' | 'baseline';
  pricingDisclaimer: string;
  pricingListingsUsed: Listing[];
  isRareInDc: boolean;
  matchingCount: number;
  hasEnoughMatchingListings: boolean;
  matchingWarning: string | null;
} {
  const validCompPrices = comparableListings
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));
  const baselineMedian = calculateMedian(validCompPrices);
  const baselineP25 = calculateP25(validCompPrices);
  const baselineP75 = calculateP75(validCompPrices);

  // Requirement 3: Kitchen and Wifi are NOT used in the amenity-adjusted price
  const effectiveSelectedAmenities = selectedAmenities.filter(
    (a) => a !== 'Wifi' && a !== 'Kitchen'
  );

  // If no non-standard amenities selected, show baseline median
  if (effectiveSelectedAmenities.length === 0) {
    return {
      adjustedPrice: baselineMedian,
      calculatedAdjustment: 0,
      adjustedP25: baselineP25,
      adjustedP75: baselineP75,
      pricingConfidenceLevel: 'baseline',
      pricingDisclaimer: `Based on ${validCompPrices.length} listings in ${neighborhoodName}`,
      pricingListingsUsed: comparableListings,
      isRareInDc: false,
      matchingCount: comparableListings.length,
      hasEnoughMatchingListings: true,
      matchingWarning: null,
    };
  }

  // Tier 1: Neighborhood matching
  const neighMatching = comparableListings.filter((r) => {
    const items = parseAmenities(r.amenities);
    return listingHasAllSelected(r, items, effectiveSelectedAmenities);
  });
  const neighMatchingPrices = neighMatching
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));

  const neighNonMatchingPrices = comparableListings
    .filter((r) => {
      const items = parseAmenities(r.amenities);
      return !listingHasAllSelected(r, items, effectiveSelectedAmenities);
    })
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));

  if (neighMatchingPrices.length >= 10 && neighNonMatchingPrices.length >= 10) {
    const matchingMedian = calculateMedian(neighMatchingPrices);
    const adj =
      matchingMedian !== null && baselineMedian !== null
        ? Math.round(matchingMedian - baselineMedian)
        : 0;

    return {
      adjustedPrice: matchingMedian,
      calculatedAdjustment: adj,
      adjustedP25: calculateP25(neighMatchingPrices),
      adjustedP75: calculateP75(neighMatchingPrices),
      pricingConfidenceLevel: 'neighborhood',
      pricingDisclaimer: `Based on ${neighMatchingPrices.length} listings in ${neighborhoodName}`,
      pricingListingsUsed: neighMatching,
      isRareInDc: false,
      matchingCount: neighMatching.length,
      hasEnoughMatchingListings: true,
      matchingWarning: null,
    };
  }

  // Tier 2: All of DC with same bedrooms, room type, and property type
  const dcMatching = categoryListings.filter((r) => {
    const items = parseAmenities(r.amenities);
    return listingHasAllSelected(r, items, effectiveSelectedAmenities);
  });
  const dcMatchingPrices = dcMatching
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));

  const dcNonMatchingPrices = categoryListings
    .filter((r) => {
      const items = parseAmenities(r.amenities);
      return !listingHasAllSelected(r, items, effectiveSelectedAmenities);
    })
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));

  const dcCategoryPrices = categoryListings
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));
  const dcCategoryMedian = calculateMedian(dcCategoryPrices);

  const ratio =
    dcCategoryMedian && dcCategoryMedian > 0 && baselineMedian
      ? baselineMedian / dcCategoryMedian
      : 1;

  if (dcMatchingPrices.length >= 10 && dcNonMatchingPrices.length >= 10) {
    const dcMatchingMedian = calculateMedian(dcMatchingPrices);
    const estimatedPrice =
      dcMatchingMedian !== null ? Math.round(dcMatchingMedian * ratio) : baselineMedian;
    const adj =
      estimatedPrice !== null && baselineMedian !== null
        ? Math.round(estimatedPrice - baselineMedian)
        : 0;

    const dcP25 = calculateP25(dcMatchingPrices);
    const dcP75 = calculateP75(dcMatchingPrices);
    const adjP25 = dcP25 !== null ? Math.round(dcP25 * ratio) : baselineP25;
    const adjP75 = dcP75 !== null ? Math.round(dcP75 * ratio) : baselineP75;

    return {
      adjustedPrice: estimatedPrice,
      calculatedAdjustment: adj,
      adjustedP25: adjP25,
      adjustedP75: adjP75,
      pricingConfidenceLevel: 'dc-category',
      pricingDisclaimer: `Few listings in this neighborhood. Estimate based on ${dcMatchingPrices.length} similar listings across DC`,
      pricingListingsUsed: dcMatching,
      isRareInDc: false,
      matchingCount: dcMatching.length,
      hasEnoughMatchingListings: true,
      matchingWarning: null,
    };
  }

  // Tier 3: Use listings that exist, however few
  if (dcMatchingPrices.length > 0) {
    const dcMatchingMedian = calculateMedian(dcMatchingPrices);
    const estimatedPrice =
      dcMatchingMedian !== null ? Math.round(dcMatchingMedian * ratio) : baselineMedian;
    const adj =
      estimatedPrice !== null && baselineMedian !== null
        ? Math.round(estimatedPrice - baselineMedian)
        : 0;

    const dcP25 = calculateP25(dcMatchingPrices);
    const dcP75 = calculateP75(dcMatchingPrices);
    const adjP25 = dcP25 !== null ? Math.round(dcP25 * ratio) : baselineP25;
    const adjP75 = dcP75 !== null ? Math.round(dcP75 * ratio) : baselineP75;

    return {
      adjustedPrice: estimatedPrice,
      calculatedAdjustment: adj,
      adjustedP25: adjP25,
      adjustedP75: adjP75,
      pricingConfidenceLevel: 'low-confidence',
      pricingDisclaimer: `Low confidence: based on only ${dcMatchingPrices.length} listings. Use as a rough guide`,
      pricingListingsUsed: dcMatching,
      isRareInDc: false,
      matchingCount: dcMatching.length,
      hasEnoughMatchingListings: false,
      matchingWarning: `Low confidence: based on only ${dcMatchingPrices.length} listings across DC with all selected amenities. Use as a rough guide.`,
    };
  }

  // Check all of DC overall short-stays
  const allDcMatching = allDcListings.filter((r) => {
    const items = parseAmenities(r.amenities);
    return listingHasAllSelected(r, items, effectiveSelectedAmenities);
  });
  const allDcMatchingPrices = allDcMatching
    .map((r) => r.price)
    .filter((p): p is number => p !== null && !isNaN(p));

  if (allDcMatchingPrices.length > 0) {
    const allDcMatchingMedian = calculateMedian(allDcMatchingPrices);
    const allDcTotalMedian = calculateMedian(
      allDcListings.map((r) => r.price).filter((p): p is number => p !== null && !isNaN(p))
    );
    const allDcRatio =
      allDcTotalMedian && allDcTotalMedian > 0 && baselineMedian
        ? baselineMedian / allDcTotalMedian
        : 1;

    const estimatedPrice =
      allDcMatchingMedian !== null ? Math.round(allDcMatchingMedian * allDcRatio) : baselineMedian;
    const adj =
      estimatedPrice !== null && baselineMedian !== null
        ? Math.round(estimatedPrice - baselineMedian)
        : 0;

    return {
      adjustedPrice: estimatedPrice,
      calculatedAdjustment: adj,
      adjustedP25: baselineP25 !== null && adj !== null ? baselineP25 + adj : baselineP25,
      adjustedP75: baselineP75 !== null && adj !== null ? baselineP75 + adj : baselineP75,
      pricingConfidenceLevel: 'low-confidence',
      pricingDisclaimer: `Low confidence: based on only ${allDcMatchingPrices.length} listings. Use as a rough guide`,
      pricingListingsUsed: allDcMatching,
      isRareInDc: false,
      matchingCount: allDcMatching.length,
      hasEnoughMatchingListings: false,
      matchingWarning: `Low confidence: based on only ${allDcMatchingPrices.length} listings across all DC with all selected amenities. Use as a rough guide.`,
    };
  }

  // Tier 4: Rare in DC (no listing has the amenity)
  return {
    adjustedPrice: null,
    calculatedAdjustment: 0,
    adjustedP25: baselineP25,
    adjustedP75: baselineP75,
    pricingConfidenceLevel: 'rare',
    pricingDisclaimer: 'Rare in DC: no comparable listings offer this amenity',
    pricingListingsUsed: [],
    isRareInDc: true,
    matchingCount: 0,
    hasEnoughMatchingListings: false,
    matchingWarning: 'Rare in DC: no comparable listings offer this amenity.',
  };
}
