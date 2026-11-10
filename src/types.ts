export interface Listing {
  id: string;
  host_is_superhost: string; // 't' | 'f'
  neighbourhood_cleansed: string;
  latitude: number;
  longitude: number;
  property_type: string;
  room_type: string;
  accommodates: number | null;
  bathrooms: number | null;
  bedrooms: number | null;
  beds: number | null;
  amenities: string;
  price: number | null;
  minimum_nights: number | null;
  availability_365: number | null;
  number_of_reviews: number | null;
  number_of_reviews_ltm: number | null;
  estimated_occupancy_l365d: number | null;
  estimated_revenue_l365d: number | null;
  last_review: string;
  review_scores_rating: number | null;
  review_scores_location: number | null;
  review_scores_value: number | null;
  instant_bookable: string;
  calculated_host_listings_count: number | null;
  reviews_per_month: number | null;
}

export interface SharedFilters {
  neighborhood: string; // 'All' or specific neighbourhood_cleansed
  bedrooms: string; // 'Any', '0', '1', '2', '3', '4', '5+'
  roomType: string; // 'Any' or specific room_type
  propertyType: string; // 'Any' or specific property_type
}

export interface GeoJsonFeature {
  type: string;
  properties: {
    neighbourhood: string;
    neighbourhood_group: string | null;
  };
  geometry: any;
}

export interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

export type MapMetric = 'price' | 'adjustedPrice' | 'occupancy' | 'revenue' | 'count';

export interface NeighborhoodStats {
  neighborhood: string;
  count: number;
  activeCount: number;
  medianPrice: number | null;
  adjustedMedianPrice: number | null;
  amenityAdjustmentTotal: number;
  medianNights: number | null;
  medianRevenue: number | null;
  isReliable: boolean; // count >= 10
  amenityMatchingCount: number;
  isAmenityReliable: boolean; // amenityMatchingCount >= 10
}

export interface AmenityAdjustmentBreakdown {
  name: string;
  category: 'Amenity' | 'Feature';
  dollarDifference: number | null;
  impact: number;
  percentHas: number;
  countHas: number;
  countNotHas: number;
  medianPriceHas: number | null;
  medianPriceNotHas: number | null;
  hasEnoughData: boolean;
  adoptionTier: 'Must-Have' | 'Common' | 'Optional';
  isApplied: boolean;
  notes: string;
  isStandard?: boolean;
  isSmallDifference?: boolean;
  displayText: string;
  disclaimer: string;
  confidenceLevel: 'neighborhood' | 'dc-category' | 'low-confidence' | 'rare' | 'standard';
  sampleSize: number;
}

export interface PricingStats {
  count: number;
  recommendedPrice: number | null;
  p25Price: number | null;
  p75Price: number | null;
  adjustedRecommendedPrice: number | null;
  adjustedP25Price: number | null;
  adjustedP75Price: number | null;
  amenityAdjustmentTotal: number;
  appliedAdjustments: AmenityAdjustmentBreakdown[];
  dcWideMedianPrice: number | null;
  bins: { rangeLabel: string; min: number; max: number; count: number }[];
  isReliable: boolean;
  matchingCount: number;
  hasEnoughMatchingListings: boolean;
  matchingWarning: string | null;
  pricingConfidenceLevel: 'neighborhood' | 'dc-category' | 'low-confidence' | 'rare' | 'baseline';
  pricingDisclaimer: string;
  pricingListingsUsed: Listing[];
  isRareInDc: boolean;
}

export interface BookingsRevenueStats {
  activeCount: number;
  totalCount: number;
  usedCount: number;
  includeInactive: boolean;
  medianNightsYear: number | null;
  nightsPerMonth: number | null;
  nightsP25: number | null;
  nightsP75: number | null;
  medianRevenueYear: number | null;
  revenuePerMonth: number | null;
  revenueP25: number | null;
  revenueP75: number | null;
  dcWideMedianNightsYear: number | null;
  dcWideMedianRevenueYear: number | null;
  revenueBins: { rangeLabel: string; min: number; max: number; count: number }[];
  isReliable: boolean;
}

export interface CompetitionStats {
  neighborhoodCount: number;
  dcCount: number;
  neighborhoodEntireHomeShare: number | null;
  dcEntireHomeShare: number | null;
  neighborhoodMultiHostShare: number | null;
  dcMultiHostShare: number | null;
  neighborhoodSuperhostShare: number | null;
  dcSuperhostShare: number | null;
  neighborhoodMedianRating: number | null;
  dcMedianRating: number | null;
  isReliable: boolean;
}

export interface AmenityComparison {
  name: string;
  category: 'Amenity' | 'Feature';
  countHas: number;
  countNotHas: number;
  percentHas: number; // e.g. 0.99 for 99%
  percentNotHas: number; // e.g. 0.01 for 1%
  medianPriceHas: number | null;
  medianPriceNotHas: number | null;
  dollarDifference: number | null;
  hasEnoughData: boolean;
  adoptionTier: 'Must-Have' | 'Common' | 'Optional';
  isStandard?: boolean;
  isSmallDifference?: boolean;
  displayText?: string;
  disclaimer?: string;
  confidenceLevel?: 'neighborhood' | 'dc-category' | 'low-confidence' | 'rare' | 'standard';
  sampleSize?: number;
}
