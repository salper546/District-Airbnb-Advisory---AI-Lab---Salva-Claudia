import React from 'react';
import { DcNeighborhoodMap } from './DcNeighborhoodMap';
import { ExpandableMethodology } from './ExpandableMethodology';
import { OwnerAmenitiesInput } from './OwnerAmenitiesInput';
import { AmenityComparison, GeoJsonData, Listing, MapMetric, NeighborhoodStats, SharedFilters } from '../types';

interface Tab1Props {
  geoJson: GeoJsonData | null;
  neighborhoodStats: Map<string, NeighborhoodStats>;
  selectedMetric: MapMetric;
  onSelectMetric: (metric: MapMetric) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (neighborhood: string) => void;
  onNavigateToPricing: () => void;
  filters: SharedFilters;
  filteredListings: Listing[]; // listings matching shared bedrooms, roomType, propertyType filters
  tabComparisons: AmenityComparison[];
  selectedAmenities: string[];
  onToggleAmenity: (name: string) => void;
  onSetAmenities: (names: string[]) => void;
  amenityAdjustmentTotal: number;
  matchingCount?: number;
  hasEnoughMatchingListings?: boolean;
  pricingDisclaimer?: string;
  isRareInDc?: boolean;
}

export const Tab1NeighborhoodMap: React.FC<Tab1Props> = ({
  geoJson,
  neighborhoodStats,
  selectedMetric,
  onSelectMetric,
  selectedNeighborhood,
  onSelectNeighborhood,
  onNavigateToPricing,
  filters,
  filteredListings,
  tabComparisons,
  selectedAmenities,
  onToggleAmenity,
  onSetAmenities,
  amenityAdjustmentTotal,
  matchingCount = 0,
  hasEnoughMatchingListings = true,
  pricingDisclaimer,
  isRareInDc = false,
}) => {
  const metricLabel =
    selectedMetric === 'price'
      ? 'Baseline Median Nightly Price'
      : selectedMetric === 'adjustedPrice'
      ? 'Amenity-Adjusted Nightly Price'
      : selectedMetric === 'occupancy'
      ? 'Median Estimated Nights Booked / Year (Active)'
      : selectedMetric === 'revenue'
      ? 'Median Estimated Annual Revenue (Active)'
      : 'Total Listings Count';

  return (
    <div className="space-y-6">
      {/* Interactive Owner Amenities & Features Input in Tab 1 */}
      <OwnerAmenitiesInput
        tabComparisons={tabComparisons}
        selectedAmenities={selectedAmenities}
        onToggleAmenity={onToggleAmenity}
        onSetAmenities={onSetAmenities}
        netAdjustment={amenityAdjustmentTotal}
        matchingCount={matchingCount}
        hasEnoughMatchingListings={hasEnoughMatchingListings}
        pricingDisclaimer={pricingDisclaimer}
        isRareInDc={isRareInDc}
      />

      {/* Map & Neighborhood Rankings */}
      <DcNeighborhoodMap
        geoJson={geoJson}
        neighborhoodStats={neighborhoodStats}
        selectedMetric={selectedMetric}
        onSelectMetric={onSelectMetric}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={onSelectNeighborhood}
        onNavigateToPricing={onNavigateToPricing}
        filters={filters}
        amenityAdjustmentTotal={amenityAdjustmentTotal}
        selectedAmenitiesCount={selectedAmenities.length}
      />

      {/* Expandable methodology section */}
      <ExpandableMethodology
        tabName="Neighborhood Map"
        filtersApplied={{
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
          metric: metricLabel,
          ownerAmenities:
            selectedAmenities.length > 0
              ? `${selectedAmenities.length} selected (${selectedAmenities.slice(0, 5).join(', ')}${selectedAmenities.length > 5 ? '...' : ''})`
              : 'None (Showing Baseline)',
        }}
        rowsUsed={filteredListings}
        formulaDescription={`Map aggregates all listings filtered by bedroom count (${filters.bedrooms}), room type (${filters.roomType}), and property type (${filters.propertyType}) across each of Washington DC's 39 administrative neighborhoods. Medians are calculated using Excel's linear interpolation method PERCENTILE.INC(A, 0.5). For occupancy and revenue metrics, only active listings (number_of_reviews_ltm >= 1) are evaluated. When "Amenity-Adjusted Price" is selected, each neighborhood's rate is computed from the median of its listings possessing all ${selectedAmenities.length} selected owner amenities. Neighborhoods with fewer than 10 matching listings are greyed out.`}
        customNotes="Occupancy and annual revenue figures are Inside Airbnb estimates based on public review cadence, not actual reservation books. Neighborhoods with fewer than 10 listings are flagged as less reliable."
      />
    </div>
  );
};
