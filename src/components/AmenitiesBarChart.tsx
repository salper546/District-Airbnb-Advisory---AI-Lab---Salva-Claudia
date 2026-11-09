import React from 'react';
import { AmenityComparison } from '../types';
import { formatCurrency } from '../utils/math';

interface AmenitiesBarChartProps {
  items: AmenityComparison[];
  selectedItemName?: string | null;
  onSelectItem?: (item: AmenityComparison) => void;
}

export const AmenitiesBarChart: React.FC<AmenitiesBarChartProps> = ({
  items,
  selectedItemName,
  onSelectItem,
}) => {
  // Filter out items with enough data for calculating scale
  const validItems = items.filter((item) => item.hasEnoughData && item.dollarDifference !== null);

  const maxAbsDiff = Math.max(
    ...validItems.map((item) => Math.abs(item.dollarDifference || 0)),
    50
  );

  // Round max scale up to nice number
  const scaleMax = Math.ceil(maxAbsDiff / 25) * 25;

  const barHeight = 28;
  const gap = 12;
  const padding = { top: 40, right: 90, bottom: 45, left: 235 };

  const plotHeight = items.length * (barHeight + gap);
  const chartHeight = plotHeight + padding.top + padding.bottom;
  const chartWidth = 820;
  const plotWidth = chartWidth - padding.left - padding.right;
  const zeroX = padding.left + (plotWidth / 2);

  // X ticks: -scaleMax, -scaleMax/2, 0, scaleMax/2, scaleMax
  const xTicks = [
    -scaleMax,
    Math.round(-scaleMax / 2),
    0,
    Math.round(scaleMax / 2),
    scaleMax,
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Price Premium by Amenity &amp; Listing Feature (USD / Night)
          </h3>
          <p className="text-xs text-neutral-500">
            Click any row to inspect adoption percentage, market classification, and pricing breakdown
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-neutral-900 rounded-sm"></span>
            <span className="text-neutral-700">Premium (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-neutral-400 rounded-sm"></span>
            <span className="text-neutral-600">Discount (−)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto custom-scrollbar">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[720px] select-none font-sans"
        >
          {/* Column Headers on top of left zone */}
          <text
            x={16}
            y={padding.top - 14}
            className="text-[10px] font-semibold uppercase tracking-wider fill-neutral-500"
          >
            Amenity / Feature
          </text>
          <text
            x={padding.left - 14}
            y={padding.top - 14}
            textAnchor="end"
            className="text-[10px] font-semibold uppercase tracking-wider fill-neutral-500"
          >
            Market Share
          </text>

          {/* Vertical grid lines for X axis */}
          {xTicks.map((tickVal) => {
            const x = zeroX + (tickVal / scaleMax) * (plotWidth / 2);
            return (
              <g key={tickVal}>
                <line
                  x1={x}
                  y1={padding.top - 5}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke={tickVal === 0 ? '#64748b' : '#e2e8f0'}
                  strokeWidth={tickVal === 0 ? 1.5 : 1}
                  strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${tickVal === 0 ? 'font-bold fill-neutral-700' : 'fill-neutral-400'}`}
                >
                  {tickVal > 0 ? `+$${tickVal}` : tickVal < 0 ? `-$${Math.abs(tickVal)}` : '$0'}
                </text>
              </g>
            );
          })}

          {/* X Axis title */}
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[11px] font-medium fill-neutral-500"
          >
            Median Nightly Price Difference (USD, rounded to nearest dollar)
          </text>

          {/* Bars */}
          {items.map((item, index) => {
            const y = padding.top + index * (barHeight + gap);
            const isSelected = selectedItemName === item.name;
            const percentStr = `${Math.round(item.percentHas * 100)}%`;

            if (!item.hasEnoughData || item.dollarDifference === null) {
              return (
                <g
                  key={item.name}
                  className="cursor-pointer"
                  onClick={() => onSelectItem?.(item)}
                >
                  {/* Row background */}
                  <rect
                    x={8}
                    y={y}
                    width={chartWidth - 16}
                    height={barHeight}
                    fill={isSelected ? '#f1f5f9' : 'transparent'}
                    stroke={isSelected ? '#94a3b8' : 'transparent'}
                    strokeWidth={isSelected ? 1 : 0}
                    rx={3}
                    className="hover:fill-neutral-100/60 transition-colors"
                  />
                  {/* Selection indicator pill on left */}
                  {isSelected && (
                    <rect
                      x={10}
                      y={y + 4}
                      width={3.5}
                      height={barHeight - 8}
                      fill="#0f172a"
                      rx={1.75}
                    />
                  )}
                  {/* Amenity Name */}
                  <text
                    x={18}
                    y={y + barHeight / 2 + 4}
                    textAnchor="start"
                    className={`text-xs ${isSelected ? 'font-bold fill-neutral-950' : 'font-medium fill-neutral-800'}`}
                  >
                    {item.name}
                  </text>
                  {/* Market Share % */}
                  <text
                    x={padding.left - 14}
                    y={y + barHeight / 2 + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono font-semibold fill-neutral-500"
                  >
                    {percentStr}
                  </text>
                  {/* Not enough data text */}
                  <text
                    x={zeroX + 15}
                    y={y + barHeight / 2 + 4}
                    textAnchor="start"
                    className="text-[11px] italic font-sans fill-neutral-400"
                  >
                    Not enough data (&lt;5 listings in a group)
                  </text>
                </g>
              );
            }

            const diff = Math.round(item.dollarDifference);
            const barW = Math.abs((diff / scaleMax) * (plotWidth / 2));
            const barX = diff >= 0 ? zeroX : zeroX - barW;
            const isPositive = diff >= 0;

            return (
              <g
                key={item.name}
                className="cursor-pointer transition-all"
                onClick={() => onSelectItem?.(item)}
              >
                {/* Row background highlight */}
                <rect
                  x={8}
                  y={y}
                  width={chartWidth - 16}
                  height={barHeight}
                  fill={isSelected ? '#f1f5f9' : 'transparent'}
                  stroke={isSelected ? '#94a3b8' : 'transparent'}
                  strokeWidth={isSelected ? 1 : 0}
                  rx={3}
                  className="hover:fill-neutral-100/60 transition-colors"
                />

                {/* Selection indicator pill on left */}
                {isSelected && (
                  <rect
                    x={10}
                    y={y + 4}
                    width={3.5}
                    height={barHeight - 8}
                    fill="#0f172a"
                    rx={1.75}
                  />
                )}

                {/* Amenity / Feature label on left */}
                <text
                  x={18}
                  y={y + barHeight / 2 + 4}
                  textAnchor="start"
                  className={`text-xs ${
                    isSelected
                      ? 'font-bold fill-neutral-950'
                      : 'font-medium fill-neutral-800'
                  }`}
                >
                  {item.name}
                </text>

                {/* Market Share % of listings */}
                <text
                  x={padding.left - 14}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  className={`text-[11px] font-mono font-semibold ${
                    item.percentHas >= 0.8
                      ? 'fill-neutral-900 font-bold'
                      : item.percentHas >= 0.4
                      ? 'fill-neutral-700'
                      : 'fill-neutral-500'
                  }`}
                >
                  {percentStr}
                </text>

                {/* The bar */}
                <rect
                  x={barX}
                  y={y + 3}
                  width={Math.max(barW, 1)}
                  height={barHeight - 6}
                  fill={isPositive ? '#0f172a' : '#94a3b8'}
                  rx={2}
                  className="transition-colors duration-150"
                />

                {/* Numeric value label at end of bar */}
                <text
                  x={isPositive ? barX + barW + 8 : barX - 8}
                  y={y + barHeight / 2 + 4}
                  textAnchor={isPositive ? 'start' : 'end'}
                  className={`text-[11px] font-mono font-semibold ${isPositive ? 'fill-neutral-900' : 'fill-neutral-600'}`}
                >
                  {isPositive ? `+$${diff}` : `-$${Math.abs(diff)}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600 leading-relaxed">
        <span className="font-semibold text-neutral-900">Adoption &amp; Pricing Note: </span>
        Market Share indicates the percentage of DC listings offering the item (e.g. Wifi at 99% is a baseline expectation; Pool at 8% is an optional luxury differentiator). Price differences represent statistical association in observed rates, not direct causality.
      </div>
    </div>
  );
};
