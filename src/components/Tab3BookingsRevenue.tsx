import React from 'react';
import { BookingsRevenueStats, Listing, SharedFilters } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { RevenueDistributionChart } from './RevenueDistributionChart';
import { AdvisorSummaryCard } from './AdvisorSummaryCard';
import { ExpandableMethodology } from './ExpandableMethodology';
import { AlertTriangle, Calendar, DollarSign, CheckSquare, Square } from 'lucide-react';

interface Tab3BookingsRevenueProps {
  filters: SharedFilters;
  stats: BookingsRevenueStats;
  onToggleIncludeInactive: (val: boolean) => void;
  rowsUsed: Listing[];
}

export const Tab3BookingsRevenue: React.FC<Tab3BookingsRevenueProps> = ({
  filters,
  stats,
  onToggleIncludeInactive,
  rowsUsed,
}) => {
  const {
    activeCount,
    totalCount,
    usedCount,
    includeInactive,
    medianNightsYear,
    nightsPerMonth,
    nightsP25,
    nightsP75,
    medianRevenueYear,
    revenuePerMonth,
    revenueP25,
    revenueP75,
    dcWideMedianNightsYear,
    dcWideMedianRevenueYear,
    revenueBins,
    isReliable,
  } = stats;

  return (
    <div className="space-y-6">
      {/* Small Sample Warning */}
      {!isReliable && usedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Small Sample Reliability Notice: </span>
            This estimate is based on only <strong>{usedCount} listings</strong> in {filters.neighborhood}. Estimates calculated from fewer than 10 listings are subject to volatility.
          </div>
        </div>
      )}

      {usedCount === 0 && (
        <div className="flex items-start gap-3 p-5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-900">No Qualifying Listings: </span>
            No qualifying listings found in {filters.neighborhood} matching the current criteria.
          </div>
        </div>
      )}

      {/* Inactive Listings Toggle Bar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => onToggleIncludeInactive(e.target.checked)}
            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-400 border-neutral-300 cursor-pointer"
          />
          <span className="text-xs font-medium text-neutral-800">
            Include inactive listings (0 reviews in the past 12 months)
          </span>
        </label>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded border border-neutral-200">
          <span>
            Active listings: <strong>{activeCount}</strong>
          </span>
          <span className="text-neutral-300">|</span>
          <span>
            Total listings: <strong>{totalCount}</strong>
          </span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-900 font-semibold">
            Using: {usedCount} listings
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Estimated Nights Booked */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-semibold text-neutral-900">
                Estimated Booked Nights
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              {filters.neighborhood}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-500 block">
                Annual Median Nights
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
                  {medianNightsYear !== null ? formatNumber(medianNightsYear, 0) : '—'}
                </span>
                <span className="text-xs text-neutral-500">nights / yr</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-neutral-500 block">
                Monthly Cadence
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
                  {nightsPerMonth !== null ? formatNumber(nightsPerMonth, 1) : '—'}
                </span>
                <span className="text-xs text-neutral-500">nights / mo</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600">
            <div>
              <span className="text-neutral-500">Suggested 25th–75th % Range: </span>
              <span className="font-mono font-semibold text-neutral-900">
                {nightsP25 !== null && nightsP75 !== null
                  ? `${formatNumber(nightsP25, 0)} – ${formatNumber(nightsP75, 0)} nights/yr`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">DC Overall Median: </span>
              <span className="font-mono font-semibold text-neutral-900">
                {dcWideMedianNightsYear !== null ? `${formatNumber(dcWideMedianNightsYear, 0)} nights/yr` : '—'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            *Occupancy is an Inside Airbnb estimate based on reviews, not actual bookings.
          </p>
        </div>

        {/* Card 2: Estimated Annual Revenue */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-semibold text-neutral-900">
                Estimated Gross Revenue
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              {filters.neighborhood}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-500 block">
                Annual Median Revenue
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
                  {formatCurrency(medianRevenueYear)}
                </span>
                <span className="text-xs text-neutral-500">/ yr</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-neutral-500 block">
                Monthly Equivalent
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900">
                  {formatCurrency(revenuePerMonth)}
                </span>
                <span className="text-xs text-neutral-500">/ mo</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600">
            <div>
              <span className="text-neutral-500">Suggested 25th–75th % Range: </span>
              <span className="font-mono font-semibold text-neutral-900">
                {revenueP25 !== null && revenueP75 !== null
                  ? `${formatCurrency(revenueP25)} – ${formatCurrency(revenueP75)}`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">DC Overall Median: </span>
              <span className="font-mono font-semibold text-neutral-900">
                {formatCurrency(dcWideMedianRevenueYear)}/yr
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            *Revenue is an Inside Airbnb estimate based on reviews, not actual bookings.
          </p>
        </div>
      </div>

      {/* Advisor Summary (Gemini 3.8 Flash Server-Side) */}
      <AdvisorSummaryCard
        tab="bookings"
        filters={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
          includeInactiveListings: includeInactive,
        }}
        metrics={{
          activeListingCount: activeCount,
          totalListingCount: totalCount,
          qualifyingListingsUsed: usedCount,
          medianEstimatedNightsBookedPerYear:
            medianNightsYear !== null ? Math.round(medianNightsYear) : null,
          medianEstimatedNightsBookedPerMonth:
            nightsPerMonth !== null ? Number(nightsPerMonth.toFixed(1)) : null,
          nightsRangeP25toP75:
            nightsP25 !== null && nightsP75 !== null
              ? `${Math.round(nightsP25)} - ${Math.round(nightsP75)} nights/year`
              : '—',
          medianEstimatedAnnualRevenueUSD:
            medianRevenueYear !== null ? Math.round(medianRevenueYear) : null,
          monthlyEstimatedRevenueUSD:
            revenuePerMonth !== null ? Math.round(revenuePerMonth) : null,
          revenueRangeP25toP75USD:
            revenueP25 !== null && revenueP75 !== null
              ? `$${Math.round(revenueP25).toLocaleString()} - $${Math.round(revenueP75).toLocaleString()}`
              : '—',
          dcWideMedianNightsPerYear:
            dcWideMedianNightsYear !== null ? Math.round(dcWideMedianNightsYear) : null,
          dcWideMedianAnnualRevenueUSD:
            dcWideMedianRevenueYear !== null ? Math.round(dcWideMedianRevenueYear) : null,
          isSampleReliable: isReliable,
        }}
      />

      {/* Annual Revenue Distribution Chart */}
      <RevenueDistributionChart
        title={`Estimated Annual Revenue Distribution: ${filters.neighborhood}`}
        bins={revenueBins}
        medianRevenue={medianRevenueYear}
        totalCount={usedCount}
      />

      {/* Expandable Methodology Section */}
      <ExpandableMethodology
        tabName="Bookings & Revenue"
        filtersApplied={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
          includeInactiveListings: includeInactive ? 'Yes' : 'No (Active Only: reviews_ltm >= 1)',
        }}
        rowsUsed={rowsUsed}
        formulaDescription="Annual booked nights and gross revenue medians are evaluated from estimated_occupancy_l365d and estimated_revenue_l365d. Monthly numbers represent the annual median divided by 12. Percentile ranges (25th and 75th percentiles) use Excel's linear interpolation formula PERCENTILE.INC. Inactive listings (zero reviews in the trailing 12 months) are excluded by default."
        customNotes="Occupancy and revenue are Inside Airbnb estimates based on reviews, not actual bookings. Estimates are derived from public guest review frequencies and minimum stay requirements."
      />
    </div>
  );
};
