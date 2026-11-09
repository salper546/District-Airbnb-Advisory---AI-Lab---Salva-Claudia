import React from 'react';
import { Listing, PricingStats, SharedFilters } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { HistogramChart } from './HistogramChart';
import { AdvisorSummaryCard } from './AdvisorSummaryCard';
import { ExpandableMethodology } from './ExpandableMethodology';
import { AlertTriangle, TrendingUp, DollarSign, Layers } from 'lucide-react';

interface Tab2PricingProps {
  filters: SharedFilters;
  stats: PricingStats;
  comparableListings: Listing[];
}

export const Tab2Pricing: React.FC<Tab2PricingProps> = ({
  filters,
  stats,
  comparableListings,
}) => {
  const {
    count,
    recommendedPrice,
    p25Price,
    p75Price,
    dcWideMedianPrice,
    bins,
    isReliable,
  } = stats;

  const priceDelta =
    recommendedPrice !== null && dcWideMedianPrice !== null
      ? recommendedPrice - dcWideMedianPrice
      : null;

  return (
    <div className="space-y-6">
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
        {/* Recommended Price */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Recommended Nightly Rate
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {formatCurrency(recommendedPrice)}
            </span>
            <span className="text-xs text-neutral-500 font-medium">/ night</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Exact median price of <strong>{count}</strong> local comparables in {filters.neighborhood}
          </p>
        </div>

        {/* Suggested Range (25th to 75th percentile) */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Suggested Price Range
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {formatCurrency(p25Price)}
            </span>
            <span className="text-neutral-400 mx-1">–</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {formatCurrency(p75Price)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            25th to 75th percentile interquartile range (Excel PERCENTILE.INC)
          </p>
        </div>

        {/* DC-Wide Comparison */}
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

        {/* Comparable Listings Count */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Comparable Listings Used
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {count}
            </span>
            <span className="text-xs text-neutral-500">active &amp; passive listings</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Matching neighborhood, bedrooms, room type, and property type
          </p>
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
          suggestedRangeP25toP75USD:
            p25Price !== null && p75Price !== null
              ? `$${Math.round(p25Price)} - $${Math.round(p75Price)}`
              : '—',
          p25PriceUSD: p25Price !== null ? Math.round(p25Price) : null,
          p75PriceUSD: p75Price !== null ? Math.round(p75Price) : null,
          dcWideMedianPriceUSD: dcWideMedianPrice !== null ? Math.round(dcWideMedianPrice) : null,
          neighborhoodVsDcDifferenceUSD: priceDelta !== null ? Math.round(priceDelta) : null,
          isSampleReliable: isReliable,
        }}
      />

      {/* Histogram of Comparable Prices */}
      <HistogramChart
        title={`Comparable Nightly Price Distribution: ${filters.neighborhood}`}
        bins={bins}
        medianPrice={recommendedPrice}
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
        }}
        rowsUsed={comparableListings}
        formulaDescription="Recommended nightly price equals the exact median price of all comparable listings matching the four active filters. The suggested price range is computed as the 25th and 75th percentiles using linear interpolation identical to Excel's PERCENTILE.INC. Listings with blank price fields are ignored."
        customNotes="Nightly prices represent the advertised base rate in USD recorded in the 19 September 2026 Inside Airbnb snapshot. They do not incorporate cleaning fees, dynamic weekend multipliers, or guest service charges."
      />
    </div>
  );
};
