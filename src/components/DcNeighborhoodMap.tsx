import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { GeoJsonData, MapMetric, NeighborhoodStats, SharedFilters } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { ArrowUpDown, MapPin, ChevronRight, AlertTriangle, Sparkles } from 'lucide-react';

interface DcNeighborhoodMapProps {
  geoJson: GeoJsonData | null;
  neighborhoodStats: Map<string, NeighborhoodStats>;
  selectedMetric: MapMetric;
  onSelectMetric: (metric: MapMetric) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (neighborhood: string) => void;
  onNavigateToPricing: () => void;
  filters: SharedFilters;
  amenityAdjustmentTotal?: number;
  selectedAmenitiesCount?: number;
}

export const DcNeighborhoodMap: React.FC<DcNeighborhoodMapProps> = ({
  geoJson,
  neighborhoodStats,
  selectedMetric,
  onSelectMetric,
  selectedNeighborhood,
  onSelectNeighborhood,
  onNavigateToPricing,
  filters,
  amenityAdjustmentTotal = 0,
  selectedAmenitiesCount = 0,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<{
    name: string;
    stats: NeighborhoodStats | null;
  } | null>(null);

  const [tableSortCol, setTableSortCol] = useState<'count' | 'price' | 'adjustedPrice' | 'nights' | 'revenue'>('price');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);

  // Calculate choropleth intervals and color function
  const colorScale = useMemo(() => {
    const values: number[] = [];
    neighborhoodStats.forEach((st) => {
      let val: number | null = null;
      if (selectedMetric === 'price') val = st.medianPrice;
      else if (selectedMetric === 'adjustedPrice') {
        // Exclude neighborhoods with <10 matching listings from color ramp
        if (st.isAmenityReliable) {
          val = st.adjustedMedianPrice;
        }
      }
      else if (selectedMetric === 'occupancy') val = st.medianNights;
      else if (selectedMetric === 'revenue') val = st.medianRevenue;
      else if (selectedMetric === 'count') val = st.count;

      if (val !== null && !isNaN(val) && val > 0) {
        values.push(val);
      }
    });

    const colors = ['#f1f5f9', '#cbd5e1', '#94a3b8', '#475569', '#0f172a'];

    if (values.length === 0) {
      return {
        getColor: () => '#e2e8f0',
        thresholds: [0, 0, 0, 0],
        colors,
      };
    }

    values.sort((a, b) => a - b);
    const q20 = values[Math.floor(values.length * 0.2)] || 0;
    const q40 = values[Math.floor(values.length * 0.4)] || 0;
    const q60 = values[Math.floor(values.length * 0.6)] || 0;
    const q80 = values[Math.floor(values.length * 0.8)] || 0;

    const thresholds = [q20, q40, q60, q80];

    const getColor = (val: number | null) => {
      if (val === null || isNaN(val) || val <= 0) return '#f8fafc';
      if (val < q20) return colors[0];
      if (val < q40) return colors[1];
      if (val < q60) return colors[2];
      if (val < q80) return colors[3];
      return colors[4];
    };

    return { getColor, thresholds, colors };
  }, [neighborhoodStats, selectedMetric]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [38.905, -77.01],
      zoom: 11,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 15,
      scrollWheelZoom: false,
    });

    // Clean CartoDB Positron tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update GeoJSON layer when geoJson, stats, metric, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJson) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const getFeatureValue = (name: string): number | null => {
      const st = neighborhoodStats.get(name);
      if (!st) return null;
      if (selectedMetric === 'price') return st.medianPrice;
      if (selectedMetric === 'adjustedPrice') {
        return st.isAmenityReliable ? st.adjustedMedianPrice : null;
      }
      if (selectedMetric === 'occupancy') return st.medianNights;
      if (selectedMetric === 'revenue') return st.medianRevenue;
      if (selectedMetric === 'count') return st.count;
      return null;
    };

    const style = (feature: any) => {
      const name = feature.properties.neighbourhood;
      const isSelected = selectedNeighborhood === name;
      const st = neighborhoodStats.get(name);

      // Requirement 4: Grey out neighborhoods with fewer than 10 matching listings when viewing Amenity-Adjusted Price
      if (selectedMetric === 'adjustedPrice') {
        const isReliable = st ? st.isAmenityReliable : false;
        if (!isReliable || !st || st.adjustedMedianPrice === null) {
          return {
            fillColor: '#f1f5f9',
            weight: isSelected ? 2.5 : 1,
            opacity: 1,
            color: isSelected ? '#000000' : '#cbd5e1',
            dashArray: '2',
            fillOpacity: isSelected ? 0.6 : 0.3,
          };
        }
      }

      const val = getFeatureValue(name);
      const fillColor = colorScale.getColor(val);

      return {
        fillColor,
        weight: isSelected ? 3 : 1.2,
        opacity: 1,
        color: isSelected ? '#000000' : '#64748b',
        dashArray: isSelected ? '' : '1',
        fillOpacity: isSelected ? 0.9 : 0.75,
      };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
      const name = feature.properties.neighbourhood;
      const st = neighborhoodStats.get(name) || null;

      layer.on({
        mouseover: (e: any) => {
          const l = e.target;
          l.setStyle({
            weight: 2.5,
            color: '#1e293b',
            fillOpacity: 0.88,
          });
          l.bringToFront();
          setHoveredNeighborhood({ name, stats: st });
        },
        mouseout: (e: any) => {
          geoJsonLayerRef.current?.resetStyle(e.target);
          setHoveredNeighborhood(null);
        },
        click: () => {
          onSelectNeighborhood(name);
        },
      });

      // Simple tooltip
      let valDisplay = 'No listings';
      if (st) {
        if (selectedMetric === 'price') {
          valDisplay = st.medianPrice ? `${formatCurrency(st.medianPrice)}/night` : 'No price data';
        } else if (selectedMetric === 'adjustedPrice') {
          if (st.isAmenityReliable && st.adjustedMedianPrice !== null) {
            valDisplay = `${formatCurrency(st.adjustedMedianPrice)}/night (${st.amenityMatchingCount} matching)`;
          } else {
            valDisplay = `Fewer than 10 matching listings (${st.amenityMatchingCount} matching)`;
          }
        } else if (selectedMetric === 'occupancy') {
          valDisplay = st.medianNights ? `${formatNumber(st.medianNights)} nights/yr` : 'No occupancy data';
        } else if (selectedMetric === 'revenue') {
          valDisplay = st.medianRevenue ? `${formatCurrency(st.medianRevenue)}/yr` : 'No revenue data';
        } else if (selectedMetric === 'count') {
          valDisplay = `${st.count} listings`;
        }
      }

      layer.bindTooltip(`<strong>${name}</strong><br/>${valDisplay}`, {
        sticky: true,
        className: 'leaflet-custom-tooltip text-xs font-sans p-1',
      });
    };

    const layer = L.geoJSON(geoJson as any, {
      style,
      onEachFeature,
    }).addTo(map);

    geoJsonLayerRef.current = layer;
  }, [geoJson, neighborhoodStats, selectedMetric, selectedNeighborhood, colorScale]);

  // Ranking table data with >=10 threshold rule
  const tableData = useMemo(() => {
    const list: NeighborhoodStats[] = [];
    neighborhoodStats.forEach((st) => {
      list.push(st);
    });

    // Sort list according to current sort column
    return list.sort((a, b) => {
      // Prioritize reliable >= 10 at top if sorting by value
      const reliableA = tableSortCol === 'adjustedPrice' ? a.isAmenityReliable : a.isReliable;
      const reliableB = tableSortCol === 'adjustedPrice' ? b.isAmenityReliable : b.isReliable;

      if (reliableA !== reliableB) {
        return reliableA ? -1 : 1;
      }

      let valA: number | null = 0;
      let valB: number | null = 0;

      if (tableSortCol === 'count') {
        valA = a.count;
        valB = b.count;
      } else if (tableSortCol === 'price') {
        valA = a.medianPrice;
        valB = b.medianPrice;
      } else if (tableSortCol === 'adjustedPrice') {
        valA = a.isAmenityReliable ? a.adjustedMedianPrice : null;
        valB = b.isAmenityReliable ? b.adjustedMedianPrice : null;
      } else if (tableSortCol === 'nights') {
        valA = a.medianNights;
        valB = b.medianNights;
      } else if (tableSortCol === 'revenue') {
        valA = a.medianRevenue;
        valB = b.medianRevenue;
      }

      if (valA === null) return 1;
      if (valB === null) return -1;

      return tableSortAsc ? valA - valB : valB - valA;
    });
  }, [neighborhoodStats, tableSortCol, tableSortAsc]);

  const handleTableSort = (col: 'count' | 'price' | 'adjustedPrice' | 'nights' | 'revenue') => {
    if (tableSortCol === col) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortCol(col);
      setTableSortAsc(false); // default desc
    }
  };

  const selectedStats = selectedNeighborhood ? neighborhoodStats.get(selectedNeighborhood) : null;

  return (
    <div className="space-y-6">
      {/* Metric Selector Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Map Choropleth Metric
          </span>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-md">
            <button
              onClick={() => onSelectMetric('price')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedMetric === 'price'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Baseline Median Price
            </button>
            <button
              onClick={() => onSelectMetric('adjustedPrice')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'adjustedPrice'
                  ? 'bg-neutral-900 text-white shadow-xs font-semibold'
                  : 'text-neutral-700 hover:text-neutral-950 bg-white/60'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Amenity-Adjusted Price</span>
            </button>
            <button
              onClick={() => onSelectMetric('occupancy')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedMetric === 'occupancy'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Median Nights Booked / Yr (Active)
            </button>
            <button
              onClick={() => onSelectMetric('revenue')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedMetric === 'revenue'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Median Annual Revenue (Active)
            </button>
            <button
              onClick={() => onSelectMetric('count')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedMetric === 'count'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Listings Count
            </button>
          </div>
        </div>

        {/* Selected Neighborhood Quick Actions */}
        {selectedNeighborhood ? (
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-3.5 py-2 rounded-md">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-900 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-500 block">Selected: {selectedNeighborhood}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 font-mono">
                    {selectedMetric === 'adjustedPrice' && selectedStats?.isAmenityReliable && selectedStats.adjustedMedianPrice !== null
                      ? `${formatCurrency(selectedStats.adjustedMedianPrice)}/nt (Adjusted)`
                      : `${formatCurrency(selectedStats?.medianPrice)}/nt (Baseline)`}
                  </span>
                  {selectedAmenitiesCount > 0 && selectedStats?.isAmenityReliable && (
                    <span className="text-[10px] font-mono text-neutral-700 bg-neutral-200/70 px-1 rounded">
                      {selectedStats.amenityMatchingCount} match all {selectedAmenitiesCount} amenities
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onNavigateToPricing}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <span>See pricing for this neighborhood</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 flex items-center gap-1.5 italic">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>Click any neighborhood polygon on the map to inspect comparable pricing</span>
          </div>
        )}
      </div>

      {/* Map Card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm relative">
        <div className="relative w-full h-[520px] rounded-md overflow-hidden border border-neutral-200">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Hover Card Overlay (Top Right) */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-neutral-200 rounded-lg p-3 shadow-md max-w-xs text-xs pointer-events-none">
            {hoveredNeighborhood ? (
              <div className="space-y-1">
                <span className="font-bold text-neutral-900 block border-b border-neutral-100 pb-1">
                  {hoveredNeighborhood.name}
                </span>
                {hoveredNeighborhood.stats ? (
                  <div className="space-y-0.5 font-mono text-[11px] text-neutral-700 pt-0.5">
                    <div className="flex justify-between gap-4">
                      <span className="text-neutral-500">Listings:</span>
                      <span className="font-bold">{hoveredNeighborhood.stats.count}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-neutral-500">Baseline Rate:</span>
                      <span className="font-bold">{formatCurrency(hoveredNeighborhood.stats.medianPrice)}</span>
                    </div>
                    {selectedAmenitiesCount > 0 && (
                      <div className="flex justify-between gap-4 text-emerald-800 font-bold bg-emerald-50/70 px-1 rounded">
                        <span>With Selected Amenities:</span>
                        <span>
                          {hoveredNeighborhood.stats.isAmenityReliable && hoveredNeighborhood.stats.adjustedMedianPrice !== null
                            ? formatCurrency(hoveredNeighborhood.stats.adjustedMedianPrice)
                            : `Fewer than 10 match (${hoveredNeighborhood.stats.amenityMatchingCount})`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-neutral-500">Median Nights/Yr:</span>
                      <span className="font-bold">{hoveredNeighborhood.stats.medianNights ? `${formatNumber(hoveredNeighborhood.stats.medianNights)}d` : '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-neutral-500">Median Revenue/Yr:</span>
                      <span className="font-bold">{formatCurrency(hoveredNeighborhood.stats.medianRevenue)}</span>
                    </div>
                    {selectedMetric === 'adjustedPrice' && !hoveredNeighborhood.stats.isAmenityReliable && (
                      <div className="text-[10px] text-amber-700 font-sans italic mt-1 pt-1 border-t border-amber-100">
                        Fewer than 10 listings have all selected amenities (greyed out)
                      </div>
                    )}
                    {selectedMetric !== 'adjustedPrice' && !hoveredNeighborhood.stats.isReliable && (
                      <div className="text-[10px] text-amber-700 font-sans italic mt-1 pt-1 border-t border-amber-100">
                        Fewer than 10 listings (less reliable)
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400 italic">No listings match current filters</span>
                )}
              </div>
            ) : selectedStats ? (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Active Selection</span>
                <span className="font-bold text-neutral-900 block">{selectedNeighborhood}</span>
                <div className="space-y-0.5 font-mono text-[11px] text-neutral-700">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">Listings:</span>
                    <span className="font-bold">{selectedStats.count}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">Baseline Rate:</span>
                    <span className="font-bold">{formatCurrency(selectedStats.medianPrice)}</span>
                  </div>
                  {selectedAmenitiesCount > 0 && (
                    <div className="flex justify-between gap-4 text-emerald-800 font-bold bg-emerald-50/70 px-1 rounded">
                      <span>Adjusted Rate:</span>
                      <span>
                        {selectedStats.isAmenityReliable && selectedStats.adjustedMedianPrice !== null
                          ? formatCurrency(selectedStats.adjustedMedianPrice)
                          : `Fewer than 10 match (${selectedStats.amenityMatchingCount})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-[11px] italic">
                Hover over a neighborhood for live metrics or click to select
              </div>
            )}
          </div>

          {/* Choropleth Legend (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs border border-neutral-200 rounded-md p-2.5 shadow-md text-xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Legend: {selectedMetric === 'price' ? 'Base Nightly Rate ($)' : selectedMetric === 'adjustedPrice' ? 'Adjusted Rate ($)' : selectedMetric === 'occupancy' ? 'Nights / Yr' : selectedMetric === 'revenue' ? 'Annual Rev ($)' : 'Listings'}
            </span>
            <div className="flex items-center gap-1">
              {colorScale.colors.map((color, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span
                    className="w-7 h-3 rounded-xs border border-neutral-300/50"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[9px] font-mono text-neutral-500 mt-1">
                    {idx === 0
                      ? 'Low'
                      : idx === colorScale.colors.length - 1
                      ? 'High'
                      : ''}
                  </span>
                </div>
              ))}
            </div>
            {selectedMetric === 'adjustedPrice' && (
              <div className="mt-2 pt-1 border-t border-neutral-200 flex items-center gap-1.5 text-[9.5px] text-neutral-500">
                <span className="w-3 h-3 rounded-xs bg-neutral-100 border border-neutral-300 border-dashed inline-block"></span>
                <span>Greyed out: &lt;10 matching listings</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>Map shows 39 Washington, DC administrative neighborhoods.</span>
          <span className="italic">*Occupancy and revenue are Inside Airbnb estimates based on reviews, not actual bookings.</span>
        </div>
      </div>

      {/* Sortable Ranking Table Below Map */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Neighborhood Performance Ranking
            </h3>
            <p className="text-xs text-neutral-500">
              Ranked by {tableSortCol.toUpperCase()} across all 39 DC neighborhoods. Neighborhoods with &lt;10 qualifying listings are displayed unranked &amp; greyed out.
            </p>
          </div>
          <div className="text-xs text-neutral-600 font-medium">
            Click any row to select neighborhood
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 select-none">
                <th className="py-2.5 px-3 font-semibold w-14 text-center">Rank</th>
                <th className="py-2.5 px-3 font-semibold">Neighborhood</th>
                <th
                  onClick={() => handleTableSort('count')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    Listings <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleTableSort('price')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    Baseline Median <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleTableSort('adjustedPrice')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900 bg-neutral-200/50"
                >
                  <div className="flex items-center justify-end gap-1 font-bold text-neutral-900">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Adjusted Rate <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleTableSort('nights')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    Median Nights/Yr <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleTableSort('revenue')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    Median Annual Revenue <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {tableData.map((row, index) => {
                const isSelected = selectedNeighborhood === row.neighborhood;
                const isRanked = tableSortCol === 'adjustedPrice' ? row.isAmenityReliable : row.isReliable;

                return (
                  <tr
                    key={row.neighborhood}
                    onClick={() => onSelectNeighborhood(row.neighborhood)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 font-semibold text-neutral-950'
                        : isRanked
                        ? 'hover:bg-neutral-50 text-neutral-900'
                        : 'opacity-50 bg-neutral-50/50 hover:bg-neutral-100/50 text-neutral-500'
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono tabular-nums">
                      {isRanked ? (
                        <span className="font-semibold">{index + 1}</span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-sans italic">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[220px]" title={row.neighborhood}>
                          {row.neighborhood}
                        </span>
                        {!isRanked && (
                          <span className="text-[9.5px] px-1.5 py-0.2 bg-neutral-200 text-neutral-600 rounded">
                            {tableSortCol === 'adjustedPrice' ? `${row.amenityMatchingCount} match (<10)` : '<10 listings'}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9.5px] px-1.5 py-0.2 bg-neutral-900 text-white rounded">
                            Selected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-medium">
                      {row.count}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(row.medianPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-neutral-950 bg-neutral-50/50">
                      {row.isAmenityReliable && row.adjustedMedianPrice !== null ? (
                        <span>
                          {formatCurrency(row.adjustedMedianPrice)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px] font-normal italic">
                          &lt;10 matching
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {row.medianNights !== null ? `${formatNumber(row.medianNights)}d` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(row.medianRevenue)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNeighborhood(row.neighborhood);
                          onNavigateToPricing();
                        }}
                        className="text-[11px] text-neutral-700 hover:text-neutral-900 underline font-medium cursor-pointer"
                      >
                        Pricing →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
