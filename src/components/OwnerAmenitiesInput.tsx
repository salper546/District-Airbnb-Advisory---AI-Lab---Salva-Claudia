import React, { useState } from 'react';
import { AmenityComparison } from '../types';
import { formatCurrency } from '../utils/math';
import {
  Sparkles,
  Check,
  Plus,
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
}

export const OwnerAmenitiesInput: React.FC<OwnerAmenitiesInputProps> = ({
  tabComparisons,
  selectedAmenities,
  onToggleAmenity,
  onSetAmenities,
  netAdjustment,
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
              Each variable's price impact is calculated as <strong className="font-mono text-neutral-700">(1 - %adoption) × median price increase</strong>. Ubiquitous amenities (e.g. Wifi 99%) add minimal premium, while rare features (e.g. Pool 6%) command major value.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Net Adjustment Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-mono">
            <span className="text-neutral-500 text-[11px]">Calculated Adjustment:</span>
            <span className={`font-bold ${netAdjustment > 0 ? 'text-emerald-700' : 'text-neutral-800'}`}>
              {netAdjustment > 0 ? `+${formatCurrency(netAdjustment)}` : '$0'}/night
            </span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
            {tabComparisons.map((item) => {
              const isSelected = selectedAmenities.includes(item.name);
              const diff = item.dollarDifference;
              const hasDiff = diff !== null && item.hasEnoughData;
              const isPositive = hasDiff && diff > 0;
              const pct = Math.round(item.percentHas * 100);
              const rarityMultiplier = Math.max(1 - item.percentHas, 0);
              const calculatedImpact =
                hasDiff && isPositive ? Math.round(rarityMultiplier * diff) : 0;

              return (
                <button
                  key={item.name}
                  onClick={() => onToggleAmenity(item.name)}
                  className={`flex flex-col text-left p-2.5 rounded-md border transition-all cursor-pointer relative ${
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

                  <div className="mt-2 flex items-center justify-between text-[10.5px]">
                    <span
                      className={`font-mono text-[10px] ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {pct}% adoption
                    </span>

                    {calculatedImpact > 0 ? (
                      <span
                        className={`font-mono font-bold text-[10px] ${
                          isSelected
                            ? 'text-emerald-300'
                            : 'text-emerald-700 bg-emerald-50 px-1 rounded'
                        }`}
                        title={`(1 - ${pct}%) × $${diff ? Math.round(diff) : 0} = +$${calculatedImpact}/nt`}
                      >
                        +{formatCurrency(calculatedImpact)}/nt
                      </span>
                    ) : (
                      <span
                        className={`text-[9.5px] font-mono ${
                          isSelected ? 'text-neutral-400' : 'text-neutral-400'
                        }`}
                        title="High adoption / negligible premium"
                      >
                        {isSelected ? '+$0/nt' : '—'}
                      </span>
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
