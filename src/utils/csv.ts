import { Listing } from '../types';

export function downloadListingsCsv(filename: string, listings: Listing[]): void {
  if (!listings || listings.length === 0) return;

  const headers: (keyof Listing)[] = [
    'id',
    'neighbourhood_cleansed',
    'property_type',
    'room_type',
    'bedrooms',
    'price',
    'minimum_nights',
    'number_of_reviews',
    'number_of_reviews_ltm',
    'review_scores_rating',
    'host_is_superhost',
    'instant_bookable',
    'calculated_host_listings_count',
    'estimated_occupancy_l365d',
    'estimated_revenue_l365d',
  ];

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.join(','));

  for (const item of listings) {
    const row = headers.map((header) => escapeCell(item[header]));
    csvRows.push(row.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
