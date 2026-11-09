import React, { useState } from 'react';
import { formatPercent } from '../utils/math';

interface CompetitionBarChartProps {
  neighborhoodName: string;
  neighborhoodEntireHomeShare: number | null;
  dcEntireHomeShare: number | null;
  neighborhoodMultiHostShare: number | null;
  dcMultiHostShare: number | null;
  neighborhoodSuperhostShare: number | null;
  dcSuperhostShare: number | null;
  neighborhoodMedianRating: number | null;
  dcMedianRating: number | null;
}

export const CompetitionBarChart: React.FC<CompetitionBarChartProps> = ({
  neighborhoodName,
  neighborhoodEntireHomeShare,
  dcEntireHomeShare,
  neighborhoodMultiHostShare,
  dcMultiHostShare,
  neighborhoodSuperhostShare,
  dcSuperhostShare,
  neighborhoodMedianRating,
  dcMedianRating,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{
    metricName: string;
    neighborhoodVal: number | null;
    dcVal: number | null;
    isRating?: boolean;
  } | null>(null);

  const metrics = [
    {
      name: 'Entire Homes',
      description: 'Share of listings offering entire private home/apt',
      neighborhoodVal: neighborhoodEntireHomeShare,
      dcVal: dcEntireHomeShare,
      unit: '%',
    },
    {
      name: 'Multi-Listing Hosts',
      description: 'Share of hosts managing 2 or more listings in DC',
      neighborhoodVal: neighborhoodMultiHostShare,
      dcVal: dcMultiHostShare,
      unit: '%',
    },
    {
      name: 'Superhosts',
      description: 'Share of listings held by verified Airbnb Superhosts',
      neighborhoodVal: neighborhoodSuperhostShare,
      dcVal: dcSuperhostShare,
      unit: '%',
    },
    {
      name: 'Median Rating',
      description: 'Median review score rating (normalized to 100% scale)',
      neighborhoodVal: neighborhoodMedianRating ? neighborhoodMedianRating / 5 : null,
      dcVal: dcMedianRating ? dcMedianRating / 5 : null,
      rawNeighborhoodVal: neighborhoodMedianRating,
      rawDcVal: dcMedianRating,
      isRating: true,
      unit: ' / 5.0',
    },
  ];

  const chartHeight = 280;
  const chartWidth = 720;
  const padding = { top: 35, right: 30, bottom: 55, left: 50 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const groupWidth = plotWidth / metrics.length;
  const barWidth = Math.min(groupWidth * 0.32, 44);
  const barGap = 6;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Market Structure: {neighborhoodName} vs. DC Overall
          </h3>
          <p className="text-xs text-neutral-500">
            Side-by-side comparison of listing format, commercial host density, superhost rate, and guest satisfaction
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-neutral-900 rounded-sm"></span>
            <span className="text-neutral-800 truncate max-w-[140px]">{neighborhoodName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-neutral-400 rounded-sm"></span>
            <span className="text-neutral-600">DC Overall</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto custom-scrollbar">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[620px] select-none font-sans"
        >
          {/* Y Axis Grid lines and labels */}
          {yTicks.map((tickVal, idx) => {
            const y = padding.top + plotHeight - tickVal * plotHeight;
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
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-neutral-400"
                >
                  {`${Math.round(tickVal * 100)}%`}
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
            Percentage / Normalized Score
          </text>

          {/* Groups of bars */}
          {metrics.map((metric, gIdx) => {
            const groupX = padding.left + gIdx * groupWidth + groupWidth / 2;
            const bar1X = groupX - barWidth - barGap / 2;
            const bar2X = groupX + barGap / 2;

            const nVal = metric.neighborhoodVal !== null ? Math.min(metric.neighborhoodVal, 1) : 0;
            const dcVal = metric.dcVal !== null ? Math.min(metric.dcVal, 1) : 0;

            const bar1Height = nVal * plotHeight;
            const bar2Height = dcVal * plotHeight;

            const bar1Y = padding.top + plotHeight - bar1Height;
            const bar2Y = padding.top + plotHeight - bar2Height;

            return (
              <g
                key={metric.name}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredItem({
                    metricName: metric.name,
                    neighborhoodVal: metric.isRating ? metric.rawNeighborhoodVal ?? null : metric.neighborhoodVal,
                    dcVal: metric.isRating ? metric.rawDcVal ?? null : metric.dcVal,
                    isRating: metric.isRating,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Background hover highlight */}
                <rect
                  x={padding.left + gIdx * groupWidth + 4}
                  y={padding.top}
                  width={groupWidth - 8}
                  height={plotHeight}
                  fill="transparent"
                  className="hover:fill-neutral-50/60"
                />

                {/* Neighborhood Bar */}
                <rect
                  x={bar1X}
                  y={bar1Y}
                  width={barWidth}
                  height={bar1Height}
                  fill="#0f172a"
                  rx={2}
                  className="transition-opacity duration-150"
                />
                {/* Neighborhood value label */}
                <text
                  x={bar1X + barWidth / 2}
                  y={bar1Y - 5}
                  textAnchor="middle"
                  className="text-[9.5px] font-mono font-semibold fill-neutral-900"
                >
                  {metric.isRating
                    ? metric.rawNeighborhoodVal?.toFixed(2) ?? '—'
                    : formatPercent(metric.neighborhoodVal, 0)}
                </text>

                {/* DC Overall Bar */}
                <rect
                  x={bar2X}
                  y={bar2Y}
                  width={barWidth}
                  height={bar2Height}
                  fill="#94a3b8"
                  rx={2}
                  className="transition-opacity duration-150"
                />
                {/* DC value label */}
                <text
                  x={bar2X + barWidth / 2}
                  y={bar2Y - 5}
                  textAnchor="middle"
                  className="text-[9.5px] font-mono font-medium fill-neutral-600"
                >
                  {metric.isRating ? metric.rawDcVal?.toFixed(2) ?? '—' : formatPercent(metric.dcVal, 0)}
                </text>

                {/* Metric label below X axis */}
                <text
                  x={groupX}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  className="text-[11px] font-medium fill-neutral-800"
                >
                  {metric.name}
                </text>
              </g>
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#94a3b8"
            strokeWidth={1}
          />

          {/* Subtitle notes */}
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            className="text-[10px] font-sans fill-neutral-400"
          >
            *Rating is normalized to 100% on the bar scale; exact 5.0 score shown above bars.
          </text>
        </svg>

        {hoveredItem && (
          <div className="mt-2 p-2 bg-neutral-900 text-white rounded text-xs flex items-center justify-between">
            <span className="font-semibold">{hoveredItem.metricName}</span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>
                {neighborhoodName}:{' '}
                <strong className="text-white">
                  {hoveredItem.isRating
                    ? hoveredItem.neighborhoodVal?.toFixed(2)
                    : formatPercent(hoveredItem.neighborhoodVal)}
                </strong>
              </span>
              <span>
                DC Overall:{' '}
                <strong className="text-neutral-300">
                  {hoveredItem.isRating ? hoveredItem.dcVal?.toFixed(2) : formatPercent(hoveredItem.dcVal)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
