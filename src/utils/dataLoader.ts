import Papa from 'papaparse';
import { GeoJsonData, Listing } from '../types';

const CSV_URL = 'https://raw.githubusercontent.com/ccatacoraq/dc-airbnb-data/refs/heads/main/DC_Airbnb_clean.csv';
const GEOJSON_URL = 'https://raw.githubusercontent.com/ccatacoraq/dc-airbnb-data/refs/heads/main/neighbourhoods.geojson';

function parseNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '') return null;
  const cleaned = str.replace(/[$,]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export async function fetchAirbnbData(): Promise<{ listings: Listing[]; geoJson: GeoJsonData }> {
  // Fetch both concurrently
  const [csvRes, geoRes] = await Promise.all([
    fetch(CSV_URL),
    fetch(GEOJSON_URL),
  ]);

  if (!csvRes.ok) {
    throw new Error(`Failed to load listings data: HTTP ${csvRes.status}`);
  }
  if (!geoRes.ok) {
    throw new Error(`Failed to load GeoJSON boundary data: HTTP ${geoRes.status}`);
  }

  const [csvText, geoJson] = await Promise.all([
    csvRes.text(),
    geoRes.json() as Promise<GeoJsonData>,
  ]);

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\ufeff/, '').trim(),
  });

  const listings: Listing[] = (parsed.data as any[]).map((row) => ({
    id: String(row.id || '').trim(),
    host_is_superhost: String(row.host_is_superhost || '').trim().toLowerCase(),
    neighbourhood_cleansed: String(row.neighbourhood_cleansed || '').trim(),
    latitude: parseNumber(row.latitude) || 38.9,
    longitude: parseNumber(row.longitude) || -77.0,
    property_type: String(row.property_type || '').trim(),
    room_type: String(row.room_type || '').trim(),
    accommodates: parseNumber(row.accommodates),
    bathrooms: parseNumber(row.bathrooms),
    bedrooms: parseNumber(row.bedrooms),
    beds: parseNumber(row.beds),
    amenities: String(row.amenities || ''),
    price: parseNumber(row.price),
    minimum_nights: parseNumber(row.minimum_nights),
    availability_365: parseNumber(row.availability_365),
    number_of_reviews: parseNumber(row.number_of_reviews),
    number_of_reviews_ltm: parseNumber(row.number_of_reviews_ltm),
    estimated_occupancy_l365d: parseNumber(row.estimated_occupancy_l365d),
    estimated_revenue_l365d: parseNumber(row.estimated_revenue_l365d),
    last_review: String(row.last_review || '').trim(),
    review_scores_rating: parseNumber(row.review_scores_rating),
    review_scores_location: parseNumber(row.review_scores_location),
    review_scores_value: parseNumber(row.review_scores_value),
    instant_bookable: String(row.instant_bookable || '').trim().toLowerCase(),
    calculated_host_listings_count: parseNumber(row.calculated_host_listings_count),
    reviews_per_month: parseNumber(row.reviews_per_month),
  }));

  return { listings, geoJson };
}
