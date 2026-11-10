import React, { useState } from 'react';
import { AmenityComparison, Listing } from '../types';
import { formatCurrency, formatPercent } from '../utils/math';
import { AmenitiesBarChart } from './AmenitiesBarChart';
import { ExpandableMethodology } from './ExpandableMethodology';
import { getAmenityDescription } from '../utils/amenityDescriptions';
import { SlidersHorizontal, CheckCircle2, ShieldCheck, Tag, Sparkles } from 'lucide-react';

interface Tab5Props {
  items: AmenityComparison[];
  bedroomsFilter: string;
  roomTypeFilter: string;
  onBedroomsChange: (val: string) => void;
  onRoomTypeChange: (val: string) => void;
  allRoomTypes: string[];
  qualifyingListings: Listing[];
}

export const Tab5AmenitiesFeatures: React.FC<Tab5Props> = ({
  items,
  bedroomsFilter,
  roomTypeFilter,
  onBedroomsChange,
  onRoomTypeChange,
  allRoomTypes,
  qualifyingListings,
}) => {
  // Default selected item to first item in the list
  const [selectedItemName, setSelectedItemName] = useState<string>(
    items[0]?.name || 'Wifi'
  );

  const selectedItem =
    items.find((i) => i.name === selectedItemName) || items[0] || null;

  const totalQualifying = selectedItem
    ? selectedItem.countHas + selectedItem.countNotHas
    : qualifyingListings.length;

  return (
    <div className="space-y-6">
      {/* Tab 5 Scope Filters Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              DC-Wide Scope Filters
            </h3>
            <p className="text-[11px] text-neutral-500">
              Evaluate amenity adoption and premiums across specific bedroom layouts and room types
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Room Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 font-medium">Room Type:</label>
            <select
              value={roomTypeFilter}
              onChange={(e) => onRoomTypeChange(e.target.value)}
              className="text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="Any">Any Room Type</option>
              {allRoomTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 font-medium">Bedrooms:</label>
            <select
              value={bedroomsFilter}
              onChange={(e) => onBedroomsChange(e.target.value)}
              className="text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="Any">Any Bedrooms</option>
              <option value="0">Studio (0 beds)</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4 Bedrooms</option>
              <option value="5+">5+ Bedrooms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Detail Card for Clicked Amenity / Feature */}
      {selectedItem && (
        <div className="bg-white border-2 border-neutral-900/15 rounded-lg p-5 shadow-sm space-y-4 transition-all">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                {selectedItem.category === 'Amenity' ? 'A' : 'F'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900">{selectedItem.name}</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                    {selectedItem.category}
                  </span>
                  {/* Market Necessity Badge */}
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                      selectedItem.adoptionTier === 'Must-Have'
                        ? 'bg-neutral-900 text-white'
                        : selectedItem.adoptionTier === 'Common'
                        ? 'bg-neutral-200 text-neutral-800'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {selectedItem.adoptionTier === 'Must-Have'
                      ? 'Must-Have Baseline'
                      : selectedItem.adoptionTier === 'Common'
                      ? 'Common Standard'
                      : 'Optional / Differentiator'}
                  </span>
                </div>
              </div>
            </div>

            {selectedItem.hasEnoughData && selectedItem.dollarDifference !== null ? (
              <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-md self-start sm:self-auto">
                <span className="text-xs text-neutral-500 font-medium">Nightly Rate Difference:</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    selectedItem.dollarDifference >= 0 ? 'text-neutral-950' : 'text-neutral-600'
                  }`}
                >
                  {selectedItem.dollarDifference >= 0 ? '+' : '-'}
                  ${Math.round(Math.abs(selectedItem.dollarDifference))} / night
                </span>
              </div>
            ) : (
              <span className="text-xs text-neutral-400 italic">
                Insufficient sample size (&lt;5 listings in a group)
              </span>
            )}
          </div>

          {/* Description Text */}
          <div className="text-xs text-neutral-700 leading-relaxed bg-neutral-50/80 p-3.5 rounded-md border border-neutral-200/80">
            <p className="font-sans font-medium text-neutral-800 leading-normal">
              {getAmenityDescription(selectedItem.name)}
            </p>
          </div>

          {/* Market Adoption Visual Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-900 inline-block"></span>
                <strong>{(selectedItem.percentHas * 100).toFixed(1)}% of listings include {selectedItem.name}</strong>
                <span className="text-neutral-500 font-mono">({selectedItem.countHas.toLocaleString()} properties)</span>
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">
                {(selectedItem.percentNotHas * 100).toFixed(1)}% lack ({selectedItem.countNotHas.toLocaleString()} properties)
              </span>
            </div>

            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden flex">
              <div
                className="bg-neutral-900 h-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(selectedItem.percentHas * 100, 1), 99.5)}%` }}
                title={`${(selectedItem.percentHas * 100).toFixed(1)}% include`}
              />
              <div
                className="bg-neutral-300 h-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(selectedItem.percentNotHas * 100, 0.5), 99)}%` }}
                title={`${(selectedItem.percentNotHas * 100).toFixed(1)}% without`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
              <span>
                {selectedItem.adoptionTier === 'Must-Have'
                  ? 'Baseline Expectation: Operating without this amenity places a listing at an immediate booking disadvantage.'
                  : selectedItem.adoptionTier === 'Common'
                  ? 'Standard Market Feature: Expected by the majority of discerning business and leisure travelers.'
                  : 'Optional / Luxury Feature: Selective offering that serves as a targeted pricing premium driver.'}
              </span>
              <span className="font-mono text-neutral-400 shrink-0">Total: {totalQualifying.toLocaleString()}</span>
            </div>
          </div>

          {/* Comparative Metrics Grid */}
          {selectedItem.hasEnoughData ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-neutral-100">
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] font-semibold uppercase text-neutral-500">
                    Has {selectedItem.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    {(selectedItem.percentHas * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-bold font-mono text-neutral-900">
                    {selectedItem.countHas.toLocaleString()} listings
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    ${selectedItem.medianPriceHas !== null ? Math.round(selectedItem.medianPriceHas) : '—'}
                    <span className="font-sans font-normal text-neutral-500">/night</span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] font-semibold uppercase text-neutral-500">
                    Lacks {selectedItem.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-600">
                    {(selectedItem.percentNotHas * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-bold font-mono text-neutral-700">
                    {selectedItem.countNotHas.toLocaleString()} listings
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    ${selectedItem.medianPriceNotHas !== null ? Math.round(selectedItem.medianPriceNotHas) : '—'}
                    <span className="font-sans font-normal text-neutral-500">/night</span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-900 text-white rounded-md shadow-xs">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] font-semibold uppercase text-neutral-300">
                    Median Price Premium
                  </span>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Difference
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-bold font-mono text-white">
                    {selectedItem.dollarDifference !== null && selectedItem.dollarDifference >= 0
                      ? `+$${Math.round(selectedItem.dollarDifference)}`
                      : `-$${selectedItem.dollarDifference !== null ? Math.round(Math.abs(selectedItem.dollarDifference)) : 0}`}
                  </span>
                  <span className="text-xs text-neutral-300 font-mono">per night</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-xs text-neutral-500 italic">
              Either the "Has feature" or "Lacks feature" sample contains fewer than 5 listings under the current scope, precluding a statistically reliable median comparison.
            </div>
          )}
        </div>
      )}

      {/* Bar Chart of Price Differences (Sorted Highest to Lowest with Market Share % and Click Handlers) */}
      <AmenitiesBarChart
        items={items}
        selectedItemName={selectedItemName}
        onSelectItem={(item) => setSelectedItemName(item.name)}
      />

      {/* Expandable Methodology Section */}
      <ExpandableMethodology
        tabName="Amenities & Features"
        filtersApplied={{
          scope: 'Washington DC Overall',
          bedrooms: bedroomsFilter,
          roomType: roomTypeFilter,
        }}
        rowsUsed={qualifyingListings}
        formulaDescription="For each amenity and feature, qualifying listings are divided into two distinct groups: listings possessing the feature and listings lacking it. Market adoption share equals count(has_feature) / total_listings. Medians of nightly prices are evaluated using Excel PERCENTILE.INC(A, 0.5) with linear interpolation, rounded to the nearest integer dollar. When either group contains fewer than 5 listings, the sample size is flagged as insufficient. Washer matches 'washer' while explicitly excluding 'dishwasher'."
        customNotes="This analysis indicates observed statistical association, not causation. Listings with specific luxury amenities frequently differ systematically in geographic submarket, home size, or construction year."
      />
    </div>
  );
};
