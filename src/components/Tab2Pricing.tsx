import React from 'react';
import { AmenityComparison, Listing, PricingStats, SharedFilters } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { HistogramChart } from './HistogramChart';
import { AdvisorSummaryCard } from './AdvisorSummaryCard';
import { ExpandableMethodology } from './ExpandableMethodology';
import { OwnerAmenitiesInput } from './OwnerAmenitiesInput';
import { AlertTriangle, TrendingUp, DollarSign, Layers, Sparkles, CheckCircle2, XCircle, Calculator } from 'lucide-react';

interface Tab2PricingProps {
  filters: SharedFilters;
  stats: PricingStats;
  comparableListings: Listing[];
  tab5Comparisons: AmenityComparison[];
  selectedAmenities: string[];
  onToggleAmenity: (name: string) => void;
  onSetAmenities: (names: string[]) => void;
}

export const Tab2Pricing: React.FC<Tab2PricingProps> = ({
  filters,
  stats,
  comparableListings,
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
  } = stats;

  const targetPrice = adjustedRecommendedPrice ?? recommendedPrice;
  const targetP25 = adjustedP25Price ?? p25Price;
  const targetP75 = adjustedP75Price ?? p75Price;

  const priceDelta =
    targetPrice !== null && dcWideMedianPrice !== null
      ? targetPrice - dcWideMedianPrice
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Owner Amenities & Features Input */}
      <OwnerAmenitiesInput
        tabComparisons={tab5Comparisons}
        selectedAmenities={selectedAmenities}
        onToggleAmenity={onToggleAmenity}
        onSetAmenities={onSetAmenities}
        netAdjustment={amenityAdjustmentTotal}
      />

      {/* Sample Size Warning */}
      {!isReliable && count > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Small Sample Reliability Notice: </span>
            This estimate is based on only <strong>{count} listings</strong> in {filters.neighborhood}. Estimates derived from fewer than 10 listings have higher statistical variance and should be interpreted with caution.
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

      {/* Main KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recommended Adjusted Rate */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Recommended Nightly Rate
            </span>
            {amenityAdjustmentTotal !== 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                +{formatCurrency(amenityAdjustmentTotal)}/nt adjustment
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {formatCurrency(targetPrice)}
            </span>
            <span className="text-xs text-neutral-500 font-medium">/ night</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            {amenityAdjustmentTotal !== 0 ? (
              <>
                Baseline {formatCurrency(recommendedPrice)} + {formatCurrency(amenityAdjustmentTotal)} from {selectedAmenities.length} selected amenities via (1 - %adoption) × Δprice
              </>
            ) : (
              <>
                Exact median price of <strong>{count}</strong> local comparables in {filters.neighborhood}
              </>
            )}
          </p>
        </div>

        {/* Suggested Range (25th to 75th percentile) */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
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
          <p className="text-[11px] text-neutral-500 mt-2">
            25th to 75th percentile interquartile range (Excel PERCENTILE.INC)
          </p>
        </div>

        {/* Baseline Comparable Median */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Baseline Comparable Median
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-800">
              {formatCurrency(recommendedPrice)}
            </span>
            <span className="text-xs text-neutral-500">/ night</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Unadjusted median of <strong>{count}</strong> comparable properties in {filters.neighborhood}
          </p>
        </div>

        {/* DC-Wide Benchmark */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            DC-Wide Benchmark Median
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-700">
              {formatCurrency(dcWideMedianPrice)}
            </span>
            <span className="text-xs text-neutral-500">/ night</span>
          </div>
          <div className="mt-2 text-[11px]">
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

      {/* Advisor Summary (Calling Gemini Server-side) */}
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

      {/* Itemized Amenity Value-Add Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                Amenity Impact Breakdown: (1 - %adoption) × Median Increase
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded font-medium">
                Rarity-Weighted Valuation
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Each variable's price addition is scaled by its rarity: rare features (Pool, Gym) contribute high premiums, while common amenities (Wifi, Kitchen) prevent double-counting.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <span className="text-neutral-500">Total Net Impact:</span>
            <span className="font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
              +{formatCurrency(amenityAdjustmentTotal)}/night
            </span>
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 select-none">
                <th className="py-2.5 px-3 font-semibold">Amenity / Feature</th>
                <th className="py-2.5 px-3 font-semibold">Property Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">DC Adoption (%adoption)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Rarity (1 - %adoption)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Median Price Increase</th>
                <th className="py-2.5 px-3 font-semibold text-right bg-neutral-200/50">Price Impact</th>
                <th className="py-2.5 px-3 font-semibold">Calculation Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {appliedAdjustments.map((adj) => {
                const isSelected = selectedAmenities.includes(adj.name);
                const adoptionPct = Math.round(adj.percentHas * 100);
                const rarityPct = Math.max(100 - adoptionPct, 0);

                return (
                  <tr
                    key={adj.name}
                    className={`transition-colors ${
                      isSelected
                        ? adj.impact > 0
                          ? 'bg-emerald-50/30 text-neutral-900 font-medium'
                          : 'bg-neutral-50/50 text-neutral-900'
                        : 'opacity-50 text-neutral-500'
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
                      {adoptionPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {rarityPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700">
                      {adj.dollarDifference > 0 ? `+${formatCurrency(adj.dollarDifference)}` : formatCurrency(adj.dollarDifference)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold bg-neutral-50/60">
                      {isSelected ? (
                        adj.impact > 0 ? (
                          <span className="text-emerald-700 font-bold">+{formatCurrency(adj.impact)}/nt</span>
                        ) : (
                          <span className="text-neutral-500 font-normal">+$0/nt</span>
                        )
                      ) : (
                        <span className="text-neutral-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 text-[11px] font-mono">
                      {adj.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histogram of Comparable Prices */}
      <HistogramChart
        title={`Comparable Nightly Price Distribution: ${filters.neighborhood}`}
        bins={bins}
        medianPrice={recommendedPrice}
        adjustedPrice={targetPrice}
        totalCount={count}
      />

      {/* Expandable Methodology Section */}
      <ExpandableMethodology
        tabName="Nightly Pricing"
        filtersApplied={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
          ownerAmenities: `${selectedAmenities.length} selected (${selectedAmenities.slice(0, 5).join(', ')}${selectedAmenities.length > 5 ? '...' : ''})`,
        }}
        rowsUsed={comparableListings}
        formulaDescription={`1. Baseline Recommended Price: Exact median nightly price of all ${count} comparable listings matching the active shared filters in ${filters.neighborhood}. Derived using linear interpolation identical to Excel's PERCENTILE.INC. 2. Amenity Pricing Adjustment: For each variable offered by the property, price impact = (1 - %adoption) × median price increase. This prevents ubiquitous amenities like Wifi (99% adoption) from inflating rates while properly compensating rare differentiators like a Pool (6% adoption) or Gym. Total calculated adjustment: +${formatCurrency(amenityAdjustmentTotal)}/night added to the baseline median.`}
        customNotes="Nightly prices represent the advertised base rate in USD recorded in the 19 September 2026 Inside Airbnb snapshot. They do not incorporate cleaning fees, dynamic weekend multipliers, or guest service charges."
      />
    </div>
  );
};
