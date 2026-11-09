import React from 'react';
import { CompetitionStats, Listing, SharedFilters } from '../types';
import { formatNumber, formatPercent } from '../utils/math';
import { CompetitionBarChart } from './CompetitionBarChart';
import { ExpandableMethodology } from './ExpandableMethodology';
import { AlertTriangle, Users, Home, Award, Star, Building2 } from 'lucide-react';

interface Tab4CompetitionProps {
  filters: SharedFilters;
  stats: CompetitionStats;
  rowsUsed: Listing[];
}

export const Tab4Competition: React.FC<Tab4CompetitionProps> = ({
  filters,
  stats,
  rowsUsed,
}) => {
  const {
    neighborhoodCount,
    dcCount,
    neighborhoodEntireHomeShare,
    dcEntireHomeShare,
    neighborhoodMultiHostShare,
    dcMultiHostShare,
    neighborhoodSuperhostShare,
    dcSuperhostShare,
    neighborhoodMedianRating,
    dcMedianRating,
    isReliable,
  } = stats;

  return (
    <div className="space-y-6">
      {/* Small Sample Warning */}
      {!isReliable && neighborhoodCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Small Sample Reliability Notice: </span>
            This competition profile is based on <strong>{neighborhoodCount} listings</strong> in {filters.neighborhood}. Estimates derived from fewer than 10 listings have higher statistical variance.
          </div>
        </div>
      )}

      {neighborhoodCount === 0 && (
        <div className="flex items-start gap-3 p-5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-900">No Listings in Neighborhood: </span>
            No listings currently match {filters.neighborhood} with {filters.bedrooms} bed(s), {filters.roomType}, and {filters.propertyType}.
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Listings */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Listings</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {neighborhoodCount}
            </span>
            <span className="text-[11px] text-neutral-500">
              / {dcCount} in DC
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            {dcCount > 0 ? ((neighborhoodCount / dcCount) * 100).toFixed(1) : 0}% of DC category stock
          </p>
        </div>

        {/* Entire Home Share */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Home className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Entire Homes</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {formatPercent(neighborhoodEntireHomeShare, 0)}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              (DC: {formatPercent(dcEntireHomeShare, 0)})
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Share of listings offering complete private unit
          </p>
        </div>

        {/* Multi-Listing Hosts */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Multi-Unit Hosts</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {formatPercent(neighborhoodMultiHostShare, 0)}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              (DC: {formatPercent(dcMultiHostShare, 0)})
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Hosts operating 2 or more listings in DC
          </p>
        </div>

        {/* Superhosts */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Superhost Share</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {formatPercent(neighborhoodSuperhostShare, 0)}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              (DC: {formatPercent(dcSuperhostShare, 0)})
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Verified Airbnb Superhost status
          </p>
        </div>

        {/* Median Review Score */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Star className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Median Rating</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {neighborhoodMedianRating !== null ? neighborhoodMedianRating.toFixed(2) : '—'}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              (DC: {dcMedianRating !== null ? dcMedianRating.toFixed(2) : '—'})
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Excel PERCENTILE.INC median of ratings
          </p>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <CompetitionBarChart
        neighborhoodName={filters.neighborhood}
        neighborhoodEntireHomeShare={neighborhoodEntireHomeShare}
        dcEntireHomeShare={dcEntireHomeShare}
        neighborhoodMultiHostShare={neighborhoodMultiHostShare}
        dcMultiHostShare={dcMultiHostShare}
        neighborhoodSuperhostShare={neighborhoodSuperhostShare}
        dcSuperhostShare={dcSuperhostShare}
        neighborhoodMedianRating={neighborhoodMedianRating}
        dcMedianRating={dcMedianRating}
      />

      {/* Expandable Methodology Section */}
      <ExpandableMethodology
        tabName="Competition"
        filtersApplied={{
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          roomType: filters.roomType,
          propertyType: filters.propertyType,
        }}
        rowsUsed={rowsUsed}
        formulaDescription="Entire home share is calculated as count(room_type = 'Entire home/apt') / total. Multi-listing host share is calculated as count(calculated_host_listings_count >= 2) / total. Superhost share is count(host_is_superhost = 't') / total. Median review rating is calculated via Excel PERCENTILE.INC(review_scores_rating, 0.5) ignoring listings with missing or blank rating fields."
        customNotes="Host portfolio counts (calculated_host_listings_count) and Superhost status reflect Inside Airbnb's DC census snapshot as of 19 September 2026."
      />
    </div>
  );
};
