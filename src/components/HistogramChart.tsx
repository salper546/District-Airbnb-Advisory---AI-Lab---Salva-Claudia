import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/math';

interface BinData {
  rangeLabel: string;
  min: number;
  max: number;
  count: number;
}

interface HistogramChartProps {
  title?: string;
  bins: BinData[];
  medianPrice: number | null;
  totalCount: number;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  title = 'Comparable Listings Nightly Price Distribution ($25 Bins)',
  bins,
  medianPrice,
  totalCount,
}) => {
  const [hoveredBin, setHoveredBin] = useState<{ bin: BinData; index: number; x: number; y: number } | null>(null);

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const chartHeight = 260;
  const chartWidth = 720;
  const padding = { top: 35, right: 30, bottom: 45, left: 50 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // 25 bins
  const binWidth = plotWidth / bins.length;

  // Calculate X position of the median line
  let medianX: number | null = null;
  if (medianPrice !== null && medianPrice >= 0) {
    if (medianPrice >= 600) {
      // Last bin ($600+)
      medianX = padding.left + 24 * binWidth + binWidth / 2;
    } else {
      // Linear mapping for 0 to 600 over the first 24 bins
      const bin24Width = binWidth * 24;
      medianX = padding.left + (medianPrice / 600) * bin24Width;
    }
  }

  // Y-axis ticks (4 ticks)
  const yTicks = [0, Math.ceil(maxCount * 0.33), Math.ceil(maxCount * 0.66), maxCount];

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500">
            Nightly listing rates binned in $25 increments up to $600, with $600+ consolidated in terminal bin
          </p>
        </div>
        {medianPrice !== null && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-100/80 px-2.5 py-1 rounded text-xs font-medium text-neutral-800">
            <span className="w-2.5 h-0.5 bg-neutral-900 inline-block"></span>
            <span>Median Nightly Rate: </span>
            <span className="font-mono font-bold text-neutral-950">{formatCurrency(medianPrice)}</span>
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
            y={14}
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
                  x={x + 1}
                  y={y}
                  width={Math.max(binWidth - 2, 1)}
                  height={barHeight}
                  fill={isHovered ? '#1e293b' : bin.count > 0 ? '#334155' : '#f1f5f9'}
                  rx={2}
                  className="transition-colors duration-150"
                />
              </g>
            );
          })}

          {/* Median Vertical Line */}
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
                x={Math.min(Math.max(medianX - 38, padding.left), padding.left + plotWidth - 76)}
                y={padding.top - 20}
                width={76}
                height={18}
                rx={3}
                fill="#0f172a"
              />
              <text
                x={Math.min(Math.max(medianX, padding.left + 38), padding.left + plotWidth - 38)}
                y={padding.top - 7}
                textAnchor="middle"
                className="text-[10px] font-mono font-semibold fill-white"
              >
                Med {formatCurrency(medianPrice)}
              </text>
            </g>
          )}

          {/* X Axis baseline */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#94a3b8"
            strokeWidth={1}
          />

          {/* X Axis Ticks and Labels: $0, $100, $200, $300, $400, $500, $600+ */}
          {[0, 100, 200, 300, 400, 500].map((val) => {
            const x = padding.left + (val / 600) * (binWidth * 24);
            return (
              <g key={val}>
                <line x1={x} y1={padding.top + plotHeight} x2={x} y2={padding.top + plotHeight + 5} stroke="#64748b" />
                <text
                  x={x}
                  y={padding.top + plotHeight + 17}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-neutral-600"
                >
                  ${val}
                </text>
              </g>
            );
          })}
          {/* $600+ tick */}
          <g>
            const lastX = padding.left + 24 * binWidth + binWidth / 2;
            <line
              x1={padding.left + 24 * binWidth}
              y1={padding.top + plotHeight}
              x2={padding.left + 24 * binWidth}
              y2={padding.top + plotHeight + 5}
              stroke="#64748b"
            />
            <text
              x={padding.left + 24 * binWidth + binWidth / 2}
              y={padding.top + plotHeight + 17}
              textAnchor="middle"
              className="text-[10px] font-mono font-semibold fill-neutral-800"
            >
              $600+
            </text>
          </g>

          {/* X Axis Title */}
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[11px] font-medium fill-neutral-500"
          >
            Nightly Listed Price in USD ($25 Bins)
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
    </div>
  );
};
