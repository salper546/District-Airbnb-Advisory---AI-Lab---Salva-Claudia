/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAirbnbData } from './utils/dataLoader';
import {
  AmenityComparison,
  BookingsRevenueStats,
  CompetitionStats,
  GeoJsonData,
  Listing,
  MapMetric,
  NeighborhoodStats,
  PricingStats,
  SharedFilters,
} from './types';
import { calculateMedian, calculateP25, calculateP75 } from './utils/math';
import { Tab1NeighborhoodMap } from './components/Tab1NeighborhoodMap';
import { Tab2Pricing } from './components/Tab2Pricing';
import { Tab3BookingsRevenue } from './components/Tab3BookingsRevenue';
import { Tab4Competition } from './components/Tab4Competition';
import { Tab5AmenitiesFeatures } from './components/Tab5AmenitiesFeatures';
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
  Building,
  RotateCcw,
  CheckCircle,
  Database,
  Filter,
} from 'lucide-react';

type TabKey = 'map' | 'pricing' | 'bookings' | 'competition' | 'amenities';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [geoJson, setGeoJson] = useState<GeoJsonData | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('map');

  // Shared Filters (Tabs 1 - 4)
  const [filters, setFilters] = useState<SharedFilters>({
    neighborhood: 'Capitol Hill, Lincoln Park',
    bedrooms: 'Any',
    roomType: 'Any',
    propertyType: 'Any',
  });

  // Tab 1 Map Metric Selection
  const [selectedMapMetric, setSelectedMapMetric] = useState<MapMetric>('price');

  // Tab 3 Inactive Listings Checkbox (off by default)
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);

  // Tab 5 Specific Filters (Default Any)
  const [tab5Bedrooms, setTab5Bedrooms] = useState<string>('Any');
  const [tab5RoomType, setTab5RoomType] = useState<string>('Any');

  // Load dataset at startup
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchAirbnbData();
        setListings(data.listings);
        setGeoJson(data.geoJson);

        // If Capitol Hill isn't present, default to the first available neighborhood
        if (data.listings.length > 0) {
          const distinctNeigh = Array.from(
            new Set(data.listings.map((l) => l.neighbourhood_cleansed).filter(Boolean))
          ).sort();

          if (!distinctNeigh.includes('Capitol Hill, Lincoln Park') && distinctNeigh.length > 0) {
            setFilters((prev) => ({ ...prev, neighborhood: distinctNeigh[0] }));
          }
        }
      } catch (err: any) {
        console.error('Data loading error:', err);
        setLoadError(err.message || 'Failed to download DC Airbnb listings dataset.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Distinct filter options derived from dataset
  const distinctNeighborhoods = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.neighbourhood_cleansed).filter(Boolean))).sort();
  }, [listings]);

  const distinctRoomTypes = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.room_type).filter(Boolean))).sort();
  }, [listings]);

  const distinctPropertyTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of listings) {
      if (l.property_type) {
        counts[l.property_type] = (counts[l.property_type] || 0) + 1;
      }
    }
    // Sort by frequency descending
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [listings]);

  // Helper filter for bedrooms, roomType, and propertyType (used across neighborhoods)
  const filterListingsByCategory = (
    list: Listing[],
    bedroomsVal: string,
    roomTypeVal: string,
    propertyTypeVal: string
  ) => {
    return list.filter((r) => {
      // Bedroom match
      if (bedroomsVal !== 'Any') {
        if (bedroomsVal === '0' && r.bedrooms !== 0) return false;
        if (bedroomsVal === '1' && r.bedrooms !== 1) return false;
        if (bedroomsVal === '2' && r.bedrooms !== 2) return false;
        if (bedroomsVal === '3' && r.bedrooms !== 3) return false;
        if (bedroomsVal === '4' && r.bedrooms !== 4) return false;
        if (bedroomsVal === '5+' && (r.bedrooms === null || r.bedrooms < 5)) return false;
      }

      // Room Type match
      if (roomTypeVal !== 'Any' && r.room_type !== roomTypeVal) {
        return false;
      }

      // Property Type match
      if (propertyTypeVal !== 'Any' && r.property_type !== propertyTypeVal) {
        return false;
      }

      return true;
    });
  };

  // Listings filtered by bedrooms, room type, and property type (across all neighborhoods for Tab 1)
  const categoryFilteredListings = useMemo(() => {
    return filterListingsByCategory(listings, filters.bedrooms, filters.roomType, filters.propertyType);
  }, [listings, filters.bedrooms, filters.roomType, filters.propertyType]);

  // Tab 1: Neighborhood stats across DC
  const neighborhoodStatsMap = useMemo(() => {
    const map = new Map<string, NeighborhoodStats>();

    // Group filtered listings by neighborhood
    const grouped: Record<string, Listing[]> = {};
    for (const item of categoryFilteredListings) {
      if (!item.neighbourhood_cleansed) continue;
      if (!grouped[item.neighbourhood_cleansed]) {
        grouped[item.neighbourhood_cleansed] = [];
      }
      grouped[item.neighbourhood_cleansed].push(item);
    }

    // Process all 39 DC neighborhoods from geojson or distinct neighborhoods
    distinctNeighborhoods.forEach((name) => {
      const items = grouped[name] || [];
      const count = items.length;

      // Prices (ignoring null/blank)
      const prices = items.map((i) => i.price).filter((p): p is number => p !== null && !isNaN(p));
      const medianPrice = calculateMedian(prices);

      // Active listings: number_of_reviews_ltm >= 1
      const activeItems = items.filter(
        (i) => i.number_of_reviews_ltm !== null && i.number_of_reviews_ltm >= 1
      );
      const activeCount = activeItems.length;

      // Occupancy (active listings only, ignoring null)
      const occupancies = activeItems
        .map((i) => i.estimated_occupancy_l365d)
        .filter((o): o is number => o !== null && !isNaN(o));
      const medianNights = calculateMedian(occupancies);

      // Revenue (active listings only, ignoring null)
      const revenues = activeItems
        .map((i) => i.estimated_revenue_l365d)
        .filter((rv): rv is number => rv !== null && !isNaN(rv));
      const medianRevenue = calculateMedian(revenues);

      map.set(name, {
        neighborhood: name,
        count,
        activeCount,
        medianPrice,
        medianNights,
        medianRevenue,
        isReliable: count >= 10,
      });
    });

    return map;
  }, [categoryFilteredListings, distinctNeighborhoods]);

  // Tab 2 & 3: Comparables matching all 4 shared filters
  const comparableListings = useMemo(() => {
    return categoryFilteredListings.filter(
      (r) => r.neighbourhood_cleansed === filters.neighborhood
    );
  }, [categoryFilteredListings, filters.neighborhood]);

  // Tab 2: Pricing Stats
  const pricingStats = useMemo<PricingStats>(() => {
    const validPrices = comparableListings
      .map((r) => r.price)
      .filter((p): p is number => p !== null && !isNaN(p));

    const count = validPrices.length;
    const recommendedPrice = calculateMedian(validPrices);
    const p25Price = calculateP25(validPrices);
    const p75Price = calculateP75(validPrices);

    // DC-wide median for the exact same bedrooms, room type, property type
    const dcPrices = categoryFilteredListings
      .map((r) => r.price)
      .filter((p): p is number => p !== null && !isNaN(p));
    const dcWideMedianPrice = calculateMedian(dcPrices);

    // Build $25 bins from $0 to $600 + $600+ terminal bin
    const bins: { rangeLabel: string; min: number; max: number; count: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const min = i * 25;
      const max = (i + 1) * 25;
      bins.push({
        rangeLabel: `$${min} – $${max - 1}`,
        min,
        max,
        count: 0,
      });
    }
    // Final $600+ bin
    bins.push({
      rangeLabel: '$600+',
      min: 600,
      max: Infinity,
      count: 0,
    });

    for (const p of validPrices) {
      if (p >= 600) {
        bins[24].count++;
      } else {
        const binIdx = Math.floor(p / 25);
        if (binIdx >= 0 && binIdx < 24) {
          bins[binIdx].count++;
        }
      }
    }

    return {
      count,
      recommendedPrice,
      p25Price,
      p75Price,
      dcWideMedianPrice,
      bins,
      isReliable: count >= 10,
    };
  }, [comparableListings, categoryFilteredListings]);

  // Tab 3: Bookings & Revenue Stats
  const { bookingsStats, bookingsRowsUsed } = useMemo<{
    bookingsStats: BookingsRevenueStats;
    bookingsRowsUsed: Listing[];
  }>(() => {
    const totalCount = comparableListings.length;
    const activeListings = comparableListings.filter(
      (r) => r.number_of_reviews_ltm !== null && r.number_of_reviews_ltm >= 1
    );
    const activeCount = activeListings.length;

    const rows = includeInactive ? comparableListings : activeListings;
    const usedCount = rows.length;

    // Nights
    const nights = rows
      .map((r) => r.estimated_occupancy_l365d)
      .filter((n): n is number => n !== null && !isNaN(n));
    const medianNightsYear = calculateMedian(nights);
    const nightsPerMonth = medianNightsYear !== null ? medianNightsYear / 12 : null;
    const nightsP25 = calculateP25(nights);
    const nightsP75 = calculateP75(nights);

    // Revenue
    const revenues = rows
      .map((r) => r.estimated_revenue_l365d)
      .filter((rv): rv is number => rv !== null && !isNaN(rv));
    const medianRevenueYear = calculateMedian(revenues);
    const revenuePerMonth = medianRevenueYear !== null ? medianRevenueYear / 12 : null;
    const revenueP25 = calculateP25(revenues);
    const revenueP75 = calculateP75(revenues);

    // DC Benchmark
    const dcRows = includeInactive
      ? categoryFilteredListings
      : categoryFilteredListings.filter(
          (r) => r.number_of_reviews_ltm !== null && r.number_of_reviews_ltm >= 1
        );
    const dcNights = dcRows
      .map((r) => r.estimated_occupancy_l365d)
      .filter((n): n is number => n !== null && !isNaN(n));
    const dcRevenues = dcRows
      .map((r) => r.estimated_revenue_l365d)
      .filter((rv): rv is number => rv !== null && !isNaN(rv));

    const dcWideMedianNightsYear = calculateMedian(dcNights);
    const dcWideMedianRevenueYear = calculateMedian(dcRevenues);

    // Distribution of annual revenue: 11 bins ($0-$10k, $10k-$20k, ..., $90k-$100k, $100k+)
    const revenueBins: { rangeLabel: string; min: number; max: number; count: number }[] = [];
    const step = 10000;
    const numBins = 10;
    for (let i = 0; i < numBins; i++) {
      const min = i * step;
      const max = (i + 1) * step;
      revenueBins.push({
        rangeLabel: `$${min / 1000}k – $${max / 1000}k`,
        min,
        max,
        count: 0,
      });
    }
    revenueBins.push({
      rangeLabel: '$100k+',
      min: 100000,
      max: Infinity,
      count: 0,
    });

    for (const rv of revenues) {
      if (rv >= 100000) {
        revenueBins[10].count++;
      } else {
        const idx = Math.floor(rv / step);
        if (idx >= 0 && idx < 10) {
          revenueBins[idx].count++;
        }
      }
    }

    return {
      bookingsStats: {
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
        isReliable: usedCount >= 10,
      },
      bookingsRowsUsed: rows,
    };
  }, [comparableListings, categoryFilteredListings, includeInactive]);

  // Tab 4: Competition Stats
  const competitionStats = useMemo<CompetitionStats>(() => {
    const neighborhoodCount = comparableListings.length;
    const dcCount = categoryFilteredListings.length;

    // Entire home share
    const nEntire = comparableListings.filter((r) => r.room_type === 'Entire home/apt').length;
    const dcEntire = categoryFilteredListings.filter((r) => r.room_type === 'Entire home/apt').length;
    const neighborhoodEntireHomeShare = neighborhoodCount > 0 ? nEntire / neighborhoodCount : null;
    const dcEntireHomeShare = dcCount > 0 ? dcEntire / dcCount : null;

    // Multi-host share: calculated_host_listings_count >= 2
    const nMulti = comparableListings.filter(
      (r) => r.calculated_host_listings_count !== null && r.calculated_host_listings_count >= 2
    ).length;
    const dcMulti = categoryFilteredListings.filter(
      (r) => r.calculated_host_listings_count !== null && r.calculated_host_listings_count >= 2
    ).length;
    const neighborhoodMultiHostShare = neighborhoodCount > 0 ? nMulti / neighborhoodCount : null;
    const dcMultiHostShare = dcCount > 0 ? dcMulti / dcCount : null;

    // Superhost share: host_is_superhost = 't'
    const nSuper = comparableListings.filter((r) => r.host_is_superhost === 't').length;
    const dcSuper = categoryFilteredListings.filter((r) => r.host_is_superhost === 't').length;
    const neighborhoodSuperhostShare = neighborhoodCount > 0 ? nSuper / neighborhoodCount : null;
    const dcSuperhostShare = dcCount > 0 ? dcSuper / dcCount : null;

    // Median review score: Excel PERCENTILE.INC on review_scores_rating
    const nRatings = comparableListings
      .map((r) => r.review_scores_rating)
      .filter((rt): rt is number => rt !== null && !isNaN(rt));
    const dcRatings = categoryFilteredListings
      .map((r) => r.review_scores_rating)
      .filter((rt): rt is number => rt !== null && !isNaN(rt));

    const neighborhoodMedianRating = calculateMedian(nRatings);
    const dcMedianRating = calculateMedian(dcRatings);

    return {
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
      isReliable: neighborhoodCount >= 10,
    };
  }, [comparableListings, categoryFilteredListings]);

  // Tab 5: DC-Wide Amenities & Features calculation
  const { tab5Comparisons, tab5QualifyingListings } = useMemo(() => {
    // Filter listings strictly by Tab 5 room type and bedrooms
    const slice = filterListingsByCategory(listings, tab5Bedrooms, tab5RoomType, 'Any');

    // Helper to parse amenities string into list of individual items
    const parseAmenities = (raw: string): string[] => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim());
        }
      } catch {
        // Fallback if not standard JSON
      }
      return raw
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, ''))
        .filter(Boolean);
    };

    // Pre-parse amenities per listing in slice
    const parsedSlice = slice.map((r) => ({
      listing: r,
      items: parseAmenities(r.amenities),
    }));

    // 12 Amenities definitions matched against each item in the amenities list
    const amenityDefs: { name: string; matchItem: (item: string) => boolean }[] = [
      { name: 'Wifi', matchItem: (item) => item.toLowerCase().includes('wifi') },
      { name: 'Kitchen', matchItem: (item) => item.toLowerCase().includes('kitchen') },
      {
        name: 'Washer',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return lower.includes('washer') && !lower.includes('dishwasher');
        },
      },
      {
        name: 'Dryer',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return lower.includes('dryer') && !lower.includes('hair dryer');
        },
      },
      {
        name: 'Air conditioning',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return (
            lower.includes('air conditioning') ||
            lower.includes('central air') ||
            lower.includes('ac unit')
          );
        },
      },
      {
        name: 'Free parking',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return (
            (lower.includes('free parking') || lower.includes('free driveway parking')) &&
            !lower.includes('free street parking') &&
            !lower.includes('street')
          );
        },
      },
      {
        name: 'Dedicated workspace',
        matchItem: (item) => item.toLowerCase().includes('dedicated workspace'),
      },
      {
        name: 'Pool',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return (
            lower.includes('pool') &&
            !lower.includes('pool table') &&
            !lower.includes('whirlpool')
          );
        },
      },
      {
        name: 'Gym',
        matchItem: (item) => item.toLowerCase().includes('gym'),
      },
      {
        name: 'Self check-in',
        matchItem: (item) => {
          const lower = item.toLowerCase();
          return (
            lower.includes('self check-in') ||
            lower.includes('smart lock') ||
            lower.includes('keypad')
          );
        },
      },
      { name: 'Pets allowed', matchItem: (item) => item.toLowerCase().includes('pets allowed') },
      { name: 'Dishwasher', matchItem: (item) => item.toLowerCase().includes('dishwasher') },
    ];

    // 3 Features definitions
    const featureDefs: { name: string; test: (row: Listing) => boolean }[] = [
      { name: 'Superhost', test: (r) => r.host_is_superhost === 't' },
      {
        name: 'Review score ≥ 4.8',
        test: (r) => r.review_scores_rating !== null && r.review_scores_rating >= 4.8,
      },
      {
        name: 'Min. stay ≤ 2 nights',
        test: (r) => r.minimum_nights !== null && r.minimum_nights <= 2,
      },
    ];

    const results: AmenityComparison[] = [];

    // Evaluate Amenities (matching item by item)
    for (const def of amenityDefs) {
      const hasList: number[] = [];
      const notHasList: number[] = [];

      for (const entry of parsedSlice) {
        if (entry.listing.price === null || isNaN(entry.listing.price)) continue;
        if (entry.items.some((item) => def.matchItem(item))) {
          hasList.push(entry.listing.price);
        } else {
          notHasList.push(entry.listing.price);
        }
      }

      const countHas = hasList.length;
      const countNotHas = notHasList.length;
      const totalCount = countHas + countNotHas;
      const percentHas = totalCount > 0 ? countHas / totalCount : 0;
      const percentNotHas = totalCount > 0 ? countNotHas / totalCount : 0;

      let adoptionTier: 'Must-Have' | 'Common' | 'Optional' = 'Optional';
      if (percentHas >= 0.8) {
        adoptionTier = 'Must-Have';
      } else if (percentHas >= 0.4) {
        adoptionTier = 'Common';
      } else {
        adoptionTier = 'Optional';
      }

      const hasEnoughData = countHas >= 5 && countNotHas >= 5;

      const medianPriceHas = calculateMedian(hasList);
      const medianPriceNotHas = calculateMedian(notHasList);
      const dollarDifference =
        hasEnoughData && medianPriceHas !== null && medianPriceNotHas !== null
          ? medianPriceHas - medianPriceNotHas
          : null;

      results.push({
        name: def.name,
        category: 'Amenity',
        countHas,
        countNotHas,
        percentHas,
        percentNotHas,
        medianPriceHas,
        medianPriceNotHas,
        dollarDifference,
        hasEnoughData,
        adoptionTier,
      });
    }

    // Evaluate Features
    for (const def of featureDefs) {
      const hasList: number[] = [];
      const notHasList: number[] = [];

      for (const r of slice) {
        if (r.price === null || isNaN(r.price)) continue;
        if (def.test(r)) {
          hasList.push(r.price);
        } else {
          notHasList.push(r.price);
        }
      }

      const countHas = hasList.length;
      const countNotHas = notHasList.length;
      const totalCount = countHas + countNotHas;
      const percentHas = totalCount > 0 ? countHas / totalCount : 0;
      const percentNotHas = totalCount > 0 ? countNotHas / totalCount : 0;

      let adoptionTier: 'Must-Have' | 'Common' | 'Optional' = 'Optional';
      if (percentHas >= 0.8) {
        adoptionTier = 'Must-Have';
      } else if (percentHas >= 0.4) {
        adoptionTier = 'Common';
      } else {
        adoptionTier = 'Optional';
      }

      const hasEnoughData = countHas >= 5 && countNotHas >= 5;

      const medianPriceHas = calculateMedian(hasList);
      const medianPriceNotHas = calculateMedian(notHasList);
      const dollarDifference =
        hasEnoughData && medianPriceHas !== null && medianPriceNotHas !== null
          ? medianPriceHas - medianPriceNotHas
          : null;

      results.push({
        name: def.name,
        category: 'Feature',
        countHas,
        countNotHas,
        percentHas,
        percentNotHas,
        medianPriceHas,
        medianPriceNotHas,
        dollarDifference,
        hasEnoughData,
        adoptionTier,
      });
    }


    // Sort by dollar difference descending (put items with not enough data at end)
    results.sort((a, b) => {
      if (a.hasEnoughData && !b.hasEnoughData) return -1;
      if (!a.hasEnoughData && b.hasEnoughData) return 1;
      if (a.dollarDifference === null) return 1;
      if (b.dollarDifference === null) return -1;
      return b.dollarDifference - a.dollarDifference;
    });

    return { tab5Comparisons: results, tab5QualifyingListings: slice };
  }, [listings, tab5Bedrooms, tab5RoomType]);

  const resetFilters = () => {
    setFilters({
      neighborhood: 'Capitol Hill, Lincoln Park',
      bedrooms: 'Any',
      roomType: 'Any',
      propertyType: 'Any',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      {/* 1. Universal Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 h-16">
            {/* Zone 1: Single text element Brand wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-neutral-900 text-white rounded-md flex items-center justify-center font-bold text-sm tracking-tight">
                DA
              </div>
              <div>
                <a
                  href="/"
                  className="text-base font-bold tracking-tight text-neutral-900 whitespace-nowrap"
                >
                  District Advisory
                </a>
                <span className="hidden sm:inline-block text-[11px] text-neutral-500 ml-2 font-mono">
                  DC Airbnb Portfolio Intelligence
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links (Single-line controls) */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-neutral-600">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                1. Neighborhood Map
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'pricing'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                2. Pricing
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                3. Bookings &amp; Revenue
              </button>
              <button
                onClick={() => setActiveTab('competition')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'competition'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                4. Competition
              </button>
              <button
                onClick={() => setActiveTab('amenities')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'amenities'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                5. Amenities &amp; Features
              </button>
            </nav>

            {/* Zone 3: Primary Action / Status Indicator */}
            <div className="flex items-center gap-3 shrink-0">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading dataset...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="font-semibold text-neutral-900">
                    Loaded {listings.length.toLocaleString()} listings
                  </span>
                  <span className="hidden md:inline text-neutral-400">·</span>
                  <span className="hidden md:inline text-neutral-500 text-[11px]">
                    Snapshot: 19 Sep 2026
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation Strip */}
        <div className="lg:hidden flex items-center overflow-x-auto custom-scrollbar border-t border-neutral-100 px-4 py-2 gap-2 text-xs font-medium text-neutral-600">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'map' ? 'bg-neutral-900 text-white font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            1. Map
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'pricing' ? 'bg-neutral-900 text-white font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            2. Pricing
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'bookings' ? 'bg-neutral-900 text-white font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            3. Bookings
          </button>
          <button
            onClick={() => setActiveTab('competition')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'competition' ? 'bg-neutral-900 text-white font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            4. Competition
          </button>
          <button
            onClick={() => setActiveTab('amenities')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'amenities' ? 'bg-neutral-900 text-white font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            5. Amenities
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Loading / Error States */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-10 h-10 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Fetching Washington, DC Airbnb Dataset
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Parsing 5,961 listings and 39 neighborhood polygon boundaries from the Inside Airbnb repository...
              </p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm space-y-2">
            <h3 className="font-semibold text-red-950">Data Loading Failure</h3>
            <p className="text-xs text-red-800 leading-relaxed">{loadError}</p>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {/* 2. Shared Filters Bar (Visible across Tabs 1 to 4) */}
            {activeTab !== 'amenities' && (
              <section className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                    <Filter className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Property Comparison Filters (Shared across Tabs 1–4)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 font-mono">
                      Matching {comparableListings.length} local comparables in {filters.neighborhood}
                    </span>
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                      title="Reset shared filters"
                    >
                      <RotateCcw className="w-3 h-3 text-neutral-400" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Filter 1: Neighborhood */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Neighborhood (DC Ward / Area)
                    </label>
                    <select
                      value={filters.neighborhood}
                      onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    >
                      {distinctNeighborhoods.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 2: Bedrooms */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Bedrooms
                    </label>
                    <select
                      value={filters.bedrooms}
                      onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
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

                  {/* Filter 3: Room Type */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Room Type
                    </label>
                    <select
                      value={filters.roomType}
                      onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    >
                      <option value="Any">Any Room Type</option>
                      {distinctRoomTypes.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 4: Property Type */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Property Type
                    </label>
                    <select
                      value={filters.propertyType}
                      onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    >
                      <option value="Any">Any Property Type</option>
                      {distinctPropertyTypes.slice(0, 20).map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Tab Views */}
            {activeTab === 'map' && (
              <Tab1NeighborhoodMap
                geoJson={geoJson}
                neighborhoodStats={neighborhoodStatsMap}
                selectedMetric={selectedMapMetric}
                onSelectMetric={setSelectedMapMetric}
                selectedNeighborhood={filters.neighborhood}
                onSelectNeighborhood={(n) => setFilters((prev) => ({ ...prev, neighborhood: n }))}
                onNavigateToPricing={() => setActiveTab('pricing')}
                filters={filters}
                filteredListings={categoryFilteredListings}
              />
            )}

            {activeTab === 'pricing' && (
              <Tab2Pricing
                filters={filters}
                stats={pricingStats}
                comparableListings={comparableListings}
              />
            )}

            {activeTab === 'bookings' && (
              <Tab3BookingsRevenue
                filters={filters}
                stats={bookingsStats}
                onToggleIncludeInactive={setIncludeInactive}
                rowsUsed={bookingsRowsUsed}
              />
            )}

            {activeTab === 'competition' && (
              <Tab4Competition
                filters={filters}
                stats={competitionStats}
                rowsUsed={comparableListings}
              />
            )}

            {activeTab === 'amenities' && (
              <Tab5AmenitiesFeatures
                items={tab5Comparisons}
                bedroomsFilter={tab5Bedrooms}
                roomTypeFilter={tab5RoomType}
                onBedroomsChange={setTab5Bedrooms}
                onRoomTypeChange={setTab5RoomType}
                allRoomTypes={distinctRoomTypes}
                qualifyingListings={tab5QualifyingListings}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">District Advisory</span>
            <span>·</span>
            <span>Washington, DC Residential Short-Term Rental Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>Inside Airbnb Snapshot: 19 September 2026 (5,961 listings)</span>
            <span>·</span>
            <span>Formulas: Excel PERCENTILE.INC Linear Interpolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
