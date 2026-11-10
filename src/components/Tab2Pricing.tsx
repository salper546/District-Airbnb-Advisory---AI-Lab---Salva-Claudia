import React from 'react';
import { AmenityComparison, Listing, PricingStats, SharedFilters } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { HistogramChart } from './HistogramChart';
import { AdvisorSummaryCard } from './AdvisorSummaryCard';
import { ExpandableMethodology } from './ExpandableMethodology';
import { OwnerAmenitiesInput } from './OwnerAmenitiesInput';
import { AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface Tab2PricingProps {
  filters: SharedFilters;
  stats: PricingStats;
  comparableListings: Listing[];
  matchingListings: Listing[];
  tab5Comparisons: AmenityComparison[];
  selectedAmenities: string[];
  onToggleAmenity: (name: string) => void;
  onSetAmenities: (names: string[]) => void;
}

export const Tab2Pricing: React.FC<Tab2PricingProps> = ({
  filters,
  stats,
  comparableListings,
  matchingListings,
  tab5Comparisons,
  selectedAmenities,
  onToggleAmenity,
  onSetAmenities,
}) => {
  const {
    count,
    recommendedPrice,
    p25Price,
    p75Price,
    adjustedRecommendedPrice,
    adjustedP25Price,
    adjustedP75Price,
    amenityAdjustmentTotal,
    appliedAdjustments,
    dcWideMedianPrice,
    bins,
    isReliable,
    matchingCount,
    hasEnoughMatchingListings,
    matchingWarning,
    pricingConfidenceLevel,
    pricingDisclaimer,
    pricingListingsUsed,
    isRareInDc,
  } = stats;

  const targetPrice = adjustedRecommendedPrice ?? recommendedPrice;
  const targetP25 = adjustedP25Price ?? p25Price;
  const targetP75 = adjustedP75Price ?? p75Price;

  const priceDelta =
    targetPrice !== null && dcWideMedianPrice !== null
      ? targetPrice - dcWideMedianPrice
      : null;

  // Requirement 2 & 6: In "Where does this number come from?", show which level was used and the listings behind it
  const listingsUsedForAdjusted =
    pricingListingsUsed && pricingListingsUsed.length > 0
      ? pricingListingsUsed
      : comparableListings;

  return (
    <div className="space-y-6">
      {/* Sample Size Warnings */}
      {!isReliable && count > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Small Sample Reliability Notice: </span>
            This baseline estimate is based on only <strong>{count} listings</strong> in {filters.neighborhood}. Estimates derived from fewer than 10 listings have higher statistical variance and should be interpreted with caution.
          </div>
        </div>
      )}

      {count === 0 && (
        <div className="flex items-start gap-3 p-5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-900">No Matching Comparable Listings: </span>
            No listings in <strong>{filters.neighborhood}</strong> match the exact combination of {filters.bedrooms} bedroom(s), {filters.roomType}, and {filters.propertyType}. Try broadening the bedroom or property type filters above.
          </div>
        </div>
      )}

      {/* Requirement 5, Item 1: The recommended price cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recommended Adjusted Rate */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                Recommended Nightly Rate
              </span>
              {selectedAmenities.length > 0 && (
                isRareInDc ? (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded">
                    Rare in DC
                  </span>
                ) : amenityAdjustmentTotal !== 0 ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      amenityAdjustmentTotal > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {amenityAdjustmentTotal > 0 ? `+${formatCurrency(amenityAdjustmentTotal)}` : `-${formatCurrency(Math.abs(amenityAdjustmentTotal))}`}/nt adjustment
                  </span>
                ) : null
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              {isRareInDc ? (
                <span className="text-sm font-semibold text-neutral-600 leading-snug">
                  Rare in DC: no comparable listings offer this amenity
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
                    {formatCurrency(targetPrice)}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">/ night</span>
                </>
              )}
            </div>
          </div>

          {/* Requirement 2: Show each disclaimer in small grey text under its number */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 leading-tight">
            {pricingDisclaimer}
          </div>
        </div>

        {/* Suggested Range (25th to 75th percentile) */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Suggested Price Range
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {formatCurrency(targetP25)}
              </span>
              <span className="text-neutral-400 mx-1">–</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {formatCurrency(targetP75)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2.5 pt-2 border-t border-neutral-100">
            25th to 75th percentile interquartile range (Excel PERCENTILE.INC)
          </p>
        </div>

        {/* Baseline Comparable Median */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Baseline Comparable Median
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-800">
                {formatCurrency(recommendedPrice)}
              </span>
              <span className="text-xs text-neutral-500">/ night</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2.5 pt-2 border-t border-neutral-100">
            Unadjusted median of <strong>{count}</strong> short-stay listings in {filters.neighborhood}
          </p>
        </div>

        {/* DC-Wide Benchmark */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              DC-Wide Benchmark Median
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-700">
                {formatCurrency(dcWideMedianPrice)}
              </span>
              <span className="text-xs text-neutral-500">/ night</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px]">
            {priceDelta !== null ? (
              <span className={`font-mono font-medium ${priceDelta >= 0 ? 'text-neutral-900' : 'text-neutral-600'}`}>
                {priceDelta >= 0 ? `+${formatCurrency(priceDelta)}` : `-${formatCurrency(Math.abs(priceDelta))}`} vs. DC overall
              </span>
            ) : (
              <span className="text-neutral-400">Baseline unavailable</span>
            )}
          </div>
        </div>
      </div>

      {/* Requirement 5, Item 2: The price distribution histogram directly below the recommended price cards */}
      <HistogramChart
        title={`Comparable Nightly Price Distribution: ${filters.neighborhood}`}
        bins={bins}
        medianPrice={recommendedPrice}
        adjustedPrice={targetPrice}
        totalCount={count}
      />

      {/* Requirement 5, Item 3: The "Amenity Price Differences" table directly below the histogram */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                Amenity Price Differences in {filters.neighborhood}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded font-medium">
                Comparables Analysis
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Prices come from comparable listings that have the selected amenities. Association, not cause.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="text-neutral-500">Calculated Adjustment:</span>
            <span className="font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
              {isRareInDc
                ? 'Rare in DC'
                : amenityAdjustmentTotal !== 0
                ? `${amenityAdjustmentTotal > 0 ? '+' : ''}${formatCurrency(amenityAdjustmentTotal)}/night`
                : '$0/night'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 select-none">
                <th className="py-2.5 px-3 font-semibold">Amenity / Feature</th>
                <th className="py-2.5 px-3 font-semibold">Property Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">With Amenity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Without Amenity</th>
                <th className="py-2.5 px-3 font-semibold text-right bg-neutral-200/50">Price Difference</th>
                <th className="py-2.5 px-3 font-semibold">Confidence / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {appliedAdjustments.map((adj) => {
                const isSelected = selectedAmenities.includes(adj.name);

                return (
                  <tr
                    key={adj.name}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-neutral-50 text-neutral-900 font-medium'
                        : 'opacity-60 text-neutral-500'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{adj.name}</span>
                        <span className="text-[10px] text-neutral-400">({adj.category})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Offered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                          <XCircle className="w-3 h-3 text-neutral-300" /> Not Selected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {adj.countHas} ({adj.medianPriceHas !== null ? formatCurrency(adj.medianPriceHas) : '—'})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {adj.countNotHas} ({adj.medianPriceNotHas !== null ? formatCurrency(adj.medianPriceNotHas) : '—'})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold bg-neutral-50/60">
                      {/* Requirements 2, 3, 4: Standard amenities, Small differences, or Difference */}
                      {adj.isStandard ? (
                        <span className="text-neutral-500 font-normal italic text-[11px]">
                          Standard amenity: expected by guests, no measurable price premium
                        </span>
                      ) : adj.confidenceLevel === 'rare' ? (
                        <span className="text-neutral-400 font-normal italic text-[11px]">
                          Rare in DC: no comparable listings offer this amenity
                        </span>
                      ) : adj.isSmallDifference ? (
                        <div>
                          <span className="text-neutral-700 font-medium text-[11px]">
                            No clear price effect
                          </span>
                          <div className="text-[9.5px] text-neutral-400 font-normal mt-0.5 font-sans">
                            {adj.disclaimer}
                          </div>
                        </div>
                      ) : adj.dollarDifference !== null ? (
                        <div>
                          <span
                            className={
                              adj.dollarDifference > 0
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-700 font-bold'
                            }
                          >
                            {adj.dollarDifference > 0
                              ? `+${formatCurrency(adj.dollarDifference)}`
                              : `-${formatCurrency(Math.abs(adj.dollarDifference))}`}
                            /nt
                          </span>
                          {/* Requirement 2: Show disclaimer in small grey text under number */}
                          <div className="text-[9.5px] text-neutral-400 font-normal mt-0.5 font-sans">
                            {adj.disclaimer}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-normal italic text-[11px]">
                          {adj.disclaimer}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 text-[11px]">
                      {adj.disclaimer}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirement 5, Item 4: Everything else in its current order */}

      {/* 4a. Owner Amenities & Features Input with Checkboxes */}
      <OwnerAmenitiesInput
        tabComparisons={tab5Comparisons}
        selectedAmenities={selectedAmenities}
        onToggleAmenity={onToggleAmenity}
        onSetAmenities={onSetAmenities}
        netAdjustment={amenityAdjustmentTotal}
        matchingCount={matchingCount}
        hasEnoughMatchingListings={hasEnoughMatchingListings}
        pricingDisclaimer={pricingDisclaimer}
        isRareInDc={isRareInDc}
      />

      {/* 4b. Advisor Summary (Calling Gemini Server-side) */}
      <AdvisorSummaryCard
        tab="pricing"
        filters={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
        }}
        metrics={{
          comparableListingsCount: count,
          recommendedMedianPriceUSD: recommendedPrice !== null ? Math.round(recommendedPrice) : null,
          amenityAdjustedRecommendedRateUSD: targetPrice !== null ? Math.round(targetPrice) : null,
          netAmenityAdjustmentUSD: Math.round(amenityAdjustmentTotal),
          selectedAmenitiesCount: selectedAmenities.length,
          selectedAmenities: selectedAmenities.slice(0, 8).join(', '),
          suggestedRangeP25toP75USD:
            targetP25 !== null && targetP75 !== null
              ? `$${Math.round(targetP25)} - $${Math.round(targetP75)}`
              : '—',
          adjustedP25PriceUSD: targetP25 !== null ? Math.round(targetP25) : null,
          adjustedP75PriceUSD: targetP75 !== null ? Math.round(targetP75) : null,
          p25PriceUSD: p25Price !== null ? Math.round(p25Price) : null,
          p75PriceUSD: p75Price !== null ? Math.round(p75Price) : null,
          dcWideMedianPriceUSD: dcWideMedianPrice !== null ? Math.round(dcWideMedianPrice) : null,
          neighborhoodVsDcDifferenceUSD: priceDelta !== null ? Math.round(priceDelta) : null,
          isSampleReliable: isReliable,
        }}
      />

      {/* 4c. Expandable Methodology Section (Requirement 2 & 6: show level used and listings behind it) */}
      <ExpandableMethodology
        tabName="Nightly Pricing"
        filtersApplied={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
          stayType: 'Short stays only (minimum stay < 30 nights)',
          ownerAmenities:
            selectedAmenities.length > 0
              ? `${selectedAmenities.length} selected (${selectedAmenities.slice(0, 5).join(', ')}${selectedAmenities.length > 5 ? '...' : ''})`
              : 'None (Showing Baseline)',
        }}
        rowsUsed={listingsUsedForAdjusted}
        levelUsed={pricingDisclaimer}
        formulaDescription={`1. Baseline Recommended Price: Exact median nightly price of all ${count} short-stay comparable listings (<30 nights) matching active shared filters in ${filters.neighborhood}. 2. Amenity-Adjusted Price: Evaluated using the confidence fallback hierarchy. Standard amenities (Wifi and Kitchen) are expected by guests and carry no price premium. ${pricingDisclaimer}. Calculated Adjustment = adjusted rate minus baseline median (${amenityAdjustmentTotal >= 0 ? `+$${amenityAdjustmentTotal}` : `-$${Math.abs(amenityAdjustmentTotal)}`}/night).`}
        customNotes="Nightly prices represent the advertised base rate in USD for short-stay listings (minimum_nights < 30) recorded in the 19 September 2026 Inside Airbnb snapshot. They do not incorporate cleaning fees, dynamic weekend multipliers, or guest service charges."
      />
    </div>
  );
};
