import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/math';

interface RevenueBinData {
  rangeLabel: string;
  min: number;
  max: number;
  count: number;
}

interface RevenueDistributionChartProps {
  title?: string;
  bins: RevenueBinData[];
  medianRevenue: number | null;
  totalCount: number;
}

export const RevenueDistributionChart: React.FC<RevenueDistributionChartProps> = ({
  title = 'Comparable Listings Estimated Annual Revenue Distribution',
  bins,
  medianRevenue,
  totalCount,
}) => {
  const [hoveredBin, setHoveredBin] = useState<{ bin: RevenueBinData; index: number; x: number; y: number } | null>(null);

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const chartHeight = 260;
  const chartWidth = 720;
  const padding = { top: 35, right: 30, bottom: 50, left: 55 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const binWidth = plotWidth / (bins.length || 1);

  // Find median bin or X position
  let medianX: number | null = null;
  if (medianRevenue !== null && bins.length > 0) {
    // Determine which bin contains the median
    const maxScaleRevenue = bins[bins.length - 1].min; // start of top bin e.g. $100k
    if (medianRevenue >= maxScaleRevenue) {
      medianX = padding.left + (bins.length - 1) * binWidth + binWidth / 2;
    } else {
      const normalBins = bins.length - 1;
      const normalWidth = binWidth * normalBins;
      medianX = padding.left + (medianRevenue / maxScaleRevenue) * normalWidth;
    }
  }

  const yTicks = [0, Math.ceil(maxCount * 0.33), Math.ceil(maxCount * 0.66), maxCount];

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500">
            Estimated gross annual revenue based on Inside Airbnb review occupancy model
          </p>
        </div>
        {medianRevenue !== null && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-100/80 px-2.5 py-1 rounded text-xs font-medium text-neutral-800">
            <span className="w-2.5 h-0.5 bg-neutral-900 inline-block"></span>
            <span>Median Est. Annual Revenue: </span>
            <span className="font-mono font-bold text-neutral-950">{formatCurrency(medianRevenue)}</span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-x-auto custom-scrollbar">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[620px] select-none font-sans"
        >
          {/* Y-axis grid lines and labels */}
          {yTicks.map((tickVal, idx) => {
            const y = padding.top + plotHeight - (tickVal / maxCount) * plotHeight;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-neutral-400"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {/* Y Axis Title */}
          <text
            x={-(padding.top + plotHeight / 2)}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[11px] font-medium fill-neutral-500"
          >
            Number of Comparable Listings
          </text>

          {/* Histogram Bars */}
          {bins.map((bin, index) => {
            const barHeight = (bin.count / maxCount) * plotHeight;
            const x = padding.left + index * binWidth;
            const y = padding.top + plotHeight - barHeight;
            const isHovered = hoveredBin?.index === index;

            return (
              <g
                key={index}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredBin({ bin, index, x: x + binWidth / 2, y })}
                onMouseLeave={() => setHoveredBin(null)}
              >
                <rect
                  x={x + 2}
                  y={y}
                  width={Math.max(binWidth - 4, 1)}
                  height={barHeight}
                  fill={isHovered ? '#1e293b' : bin.count > 0 ? '#475569' : '#f1f5f9'}
                  rx={2}
                  className="transition-colors duration-150"
                />
              </g>
            );
          })}

          {/* Median Line */}
          {medianX !== null && (
            <g>
              <line
                x1={medianX}
                y1={padding.top}
                x2={medianX}
                y2={padding.top + plotHeight}
                stroke="#0f172a"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              <circle cx={medianX} cy={padding.top} r={3.5} fill="#0f172a" />
              <rect
                x={Math.min(Math.max(medianX - 42, padding.left), padding.left + plotWidth - 84)}
                y={padding.top - 20}
                width={84}
                height={18}
                rx={3}
                fill="#0f172a"
              />
              <text
                x={Math.min(Math.max(medianX, padding.left + 42), padding.left + plotWidth - 42)}
                y={padding.top - 7}
                textAnchor="middle"
                className="text-[10px] font-mono font-semibold fill-white"
              >
                Med {formatCurrency(medianRevenue)}
              </text>
            </g>
          )}

          {/* X Axis line */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#94a3b8"
            strokeWidth={1}
          />

          {/* X Axis Labels */}
          {bins.map((bin, index) => {
            const x = padding.left + index * binWidth + binWidth / 2;
            // Show every other label if many bins to prevent crowding
            const showLabel = bins.length <= 8 || index % 2 === 0 || index === bins.length - 1;
            if (!showLabel) return null;

            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={padding.top + plotHeight}
                  x2={x}
                  y2={padding.top + plotHeight + 4}
                  stroke="#94a3b8"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  className="text-[9.5px] font-mono fill-neutral-600"
                >
                  {bin.min >= 1000 ? `$${bin.min / 1000}k` : `$${bin.min}`}
                </text>
              </g>
            );
          })}

          {/* X Axis Title */}
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-[11px] font-medium fill-neutral-500"
          >
            Estimated Annual Revenue (USD)
          </text>
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredBin && (
          <div
            className="absolute pointer-events-none z-20 bg-neutral-900 text-white p-2.5 rounded shadow-lg text-xs font-sans transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredBin.x / chartWidth) * 100}%`,
              top: `${(hoveredBin.y / chartHeight) * 100}%`,
            }}
          >
            <p className="font-semibold text-neutral-200">{hoveredBin.bin.rangeLabel}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="font-mono text-white font-bold">{hoveredBin.bin.count} listings</span>
              <span className="text-neutral-400">
                ({totalCount > 0 ? ((hoveredBin.bin.count / totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-neutral-500 italic text-right">
        *Occupancy and revenue are Inside Airbnb estimates based on reviews, not actual bookings.
      </p>
    </div>
  );
};
