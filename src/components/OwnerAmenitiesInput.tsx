import React, { useState } from 'react';
import { AmenityComparison } from '../types';
import { formatCurrency } from '../utils/math';
import {
  Sparkles,
  Check,
  Wifi,
  Utensils,
  Wind,
  Car,
  Laptop,
  Waves,
  Dumbbell,
  Key,
  Dog,
  ShieldCheck,
  Star,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

interface OwnerAmenitiesInputProps {
  tabComparisons: AmenityComparison[];
  selectedAmenities: string[];
  onToggleAmenity: (name: string) => void;
  onSetAmenities: (names: string[]) => void;
  netAdjustment: number;
  matchingCount?: number;
  hasEnoughMatchingListings?: boolean;
  pricingDisclaimer?: string;
  isRareInDc?: boolean;
}

export const OwnerAmenitiesInput: React.FC<OwnerAmenitiesInputProps> = ({
  tabComparisons,
  selectedAmenities,
  onToggleAmenity,
  onSetAmenities,
  netAdjustment,
  matchingCount = 0,
  hasEnoughMatchingListings = true,
  pricingDisclaimer,
  isRareInDc = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Icon mapping helper
  const getIcon = (name: string) => {
    switch (name) {
      case 'Wifi':
        return <Wifi className="w-3.5 h-3.5" />;
      case 'Kitchen':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'Washer':
      case 'Dryer':
      case 'Dishwasher':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Air conditioning':
        return <Wind className="w-3.5 h-3.5" />;
      case 'Free parking':
        return <Car className="w-3.5 h-3.5" />;
      case 'Dedicated workspace':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Pool':
        return <Waves className="w-3.5 h-3.5" />;
      case 'Gym':
        return <Dumbbell className="w-3.5 h-3.5" />;
      case 'Self check-in':
        return <Key className="w-3.5 h-3.5" />;
      case 'Pets allowed':
        return <Dog className="w-3.5 h-3.5" />;
      case 'Superhost':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'Review score ≥ 4.8':
        return <Star className="w-3.5 h-3.5" />;
      case 'Min. stay ≤ 2 nights':
        return <Calendar className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'standard') {
      onSetAmenities([
        'Wifi',
        'Air conditioning',
        'Kitchen',
        'Washer',
        'Dryer',
        'Dedicated workspace',
        'Self check-in',
      ]);
    } else if (presetName === 'luxury') {
      onSetAmenities([
        'Wifi',
        'Air conditioning',
        'Kitchen',
        'Washer',
        'Dryer',
        'Dedicated workspace',
        'Free parking',
        'Dishwasher',
        'Gym',
        'Pool',
        'Self check-in',
        'Superhost',
        'Review score ≥ 4.8',
      ]);
    } else if (presetName === 'budget') {
      onSetAmenities(['Wifi', 'Air conditioning']);
    } else if (presetName === 'all') {
      onSetAmenities(tabComparisons.map((c) => c.name));
    } else if (presetName === 'clear') {
      onSetAmenities([]);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Owner Property Amenities &amp; Features
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded">
                {selectedAmenities.length} of {tabComparisons.length} selected
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Prices come from comparable listings that have the selected amenities. Association, not cause.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-mono">
                <span className="text-neutral-500 text-[11px]">Calculated Adjustment:</span>
                <span
                  className={`font-bold ${
                    isRareInDc
                      ? 'text-neutral-600'
                      : netAdjustment > 0
                      ? 'text-emerald-700'
                      : netAdjustment < 0
                      ? 'text-rose-700'
                      : 'text-neutral-800'
                  }`}
                >
                  {isRareInDc
                    ? 'Rare in DC'
                    : netAdjustment !== 0
                    ? `${netAdjustment > 0 ? '+' : ''}${formatCurrency(netAdjustment)}/night`
                    : '$0/night'}
                </span>
              </div>
              {pricingDisclaimer && (
                <span className="text-[10px] text-neutral-500 font-sans mt-0.5 max-w-[280px] text-right truncate" title={pricingDisclaimer}>
                  {pricingDisclaimer}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse amenities panel' : 'Expand amenities panel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-neutral-400 font-medium mr-1 text-[10px] uppercase tracking-wide">
              Quick Presets:
            </span>
            <button
              onClick={() => applyPreset('standard')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors cursor-pointer"
            >
              Standard DC Home
            </button>
            <button
              onClick={() => applyPreset('luxury')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors cursor-pointer"
            >
              Executive / Luxury
            </button>
            <button
              onClick={() => applyPreset('budget')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors cursor-pointer"
            >
              Essential Studio
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={() => applyPreset('clear')}
              className="px-2 py-0.5 rounded text-neutral-500 hover:text-neutral-800 hover:underline transition-colors cursor-pointer ml-auto"
            >
              Clear All
            </button>
          </div>

          {/* Amenities & Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            {tabComparisons.map((item) => {
              const isSelected = selectedAmenities.includes(item.name);

              return (
                <button
                  key={item.name}
                  onClick={() => onToggleAmenity(item.name)}
                  title={item.disclaimer}
                  className={`flex flex-col text-left p-2.5 rounded-md border transition-all cursor-pointer relative min-h-[92px] justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:bg-neutral-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className={isSelected ? 'text-white' : 'text-neutral-500'}>
                        {getIcon(item.name)}
                      </span>
                      <span className="text-xs font-semibold truncate leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[10px] ${
                        isSelected
                          ? 'bg-white text-neutral-950 font-bold'
                          : 'border border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Amenity Price Difference & Confidence Disclaimers */}
                  <div className="mt-2 w-full">
                    {/* Requirement 3: Standard Amenities (Kitchen and Wifi) */}
                    {item.isStandard ? (
                      <div className="text-[10px] font-medium leading-tight">
                        <span className={isSelected ? 'text-neutral-200' : 'text-neutral-600'}>
                          Standard amenity: expected by guests, no measurable price premium
                        </span>
                      </div>
                    ) : item.confidenceLevel === 'rare' ? (
                      /* Requirement 2: Rare in DC */
                      <div className="text-[10px] font-medium leading-tight text-neutral-400">
                        Rare in DC: no comparable listings offer this amenity
                      </div>
                    ) : item.isSmallDifference ? (
                      /* Requirement 4: Small differences between -$10 and +$10 */
                      <div className="text-[10px] font-medium leading-tight">
                        <span className={isSelected ? 'text-neutral-200' : 'text-neutral-600'}>
                          No clear price effect
                        </span>
                        {/* Requirement 2: Small grey disclaimer under number */}
                        <div
                          className={`text-[9px] mt-1 truncate ${
                            isSelected ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                          title={item.disclaimer}
                        >
                          {item.disclaimer}
                        </div>
                      </div>
                    ) : (
                      /* Notable differences */
                      <div>
                        <span
                          className={`font-mono font-bold text-xs ${
                            isSelected
                              ? item.dollarDifference! > 0
                                ? 'text-emerald-300'
                                : 'text-rose-300'
                              : item.dollarDifference! > 0
                              ? 'text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded'
                              : 'text-rose-700 bg-rose-50 px-1 py-0.2 rounded'
                          }`}
                        >
                          {item.dollarDifference! > 0
                            ? `+${formatCurrency(item.dollarDifference!)}`
                            : `-${formatCurrency(Math.abs(item.dollarDifference!))}`}
                          /nt
                        </span>
                        {/* Requirement 2: Small grey disclaimer under number */}
                        <div
                          className={`text-[9px] mt-1 truncate ${
                            isSelected ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                          title={item.disclaimer}
                        >
                          {item.disclaimer}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
