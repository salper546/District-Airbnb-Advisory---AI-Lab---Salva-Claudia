import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Search, ArrowUpDown, Filter, Calculator } from 'lucide-react';
import { Listing } from '../types';
import { formatCurrency, formatNumber } from '../utils/math';
import { downloadListingsCsv } from '../utils/csv';

interface ExpandableMethodologyProps {
  title?: string;
  tabName: string;
  filtersApplied: Record<string, string | number | boolean | null | undefined>;
  rowsUsed: Listing[];
  formulaDescription: string;
  customNotes?: string;
  levelUsed?: string;
}

type SortField =
  | 'id'
  | 'neighbourhood_cleansed'
  | 'room_type'
  | 'bedrooms'
  | 'price'
  | 'number_of_reviews_ltm'
  | 'review_scores_rating'
  | 'estimated_occupancy_l365d'
  | 'estimated_revenue_l365d';

export const ExpandableMethodology: React.FC<ExpandableMethodologyProps> = ({
  tabName,
  filtersApplied,
  rowsUsed,
  formulaDescription,
  customNotes,
  levelUsed,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
    setCurrentPage(1);
  };

  const filteredAndSortedRows = useMemo(() => {
    let list = rowsUsed;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.neighbourhood_cleansed.toLowerCase().includes(q) ||
          r.property_type.toLowerCase().includes(q) ||
          r.room_type.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [rowsUsed, searchTerm, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const paginatedRows = filteredAndSortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilters = Object.entries(filtersApplied).filter(
    ([_, val]) => val !== undefined && val !== null && val !== ''
  );

  return (
    <div className="mt-8 border border-neutral-200 bg-white rounded-lg shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors cursor-pointer border-b border-neutral-200/80"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-neutral-200/80 flex items-center justify-center text-neutral-700">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Where does this number come from?</h4>
            <p className="text-xs text-neutral-500">
              Audit data lineage, applied filters, exact mathematical formulas, and {rowsUsed.length.toLocaleString()} underlying listings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
          <span>{isOpen ? 'Hide verification data' : 'Inspect calculation & dataset'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-6">
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Applied filters */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-700">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                <span>Filters Applied ({tabName})</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-600">
                {activeFilters.length > 0 ? (
                  activeFilters.map(([key, val]) => (
                    <li key={key} className="flex justify-between items-baseline border-b border-neutral-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="capitalize text-neutral-500">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-neutral-900">{String(val)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-neutral-400 italic">No specific filters applied</li>
                )}
              </ul>
            </div>

            {/* 2. Sample size */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-700">
                <Calculator className="w-3.5 h-3.5 text-neutral-500" />
                <span>Rows Used in Calculation</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                  {rowsUsed.length.toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500">qualifying listings</span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Rows with missing or blank values for relevant calculation fields are strictly ignored according to rules.
              </p>
            </div>

            {/* 3. Mathematical Formula */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-700">Formula & Method</span>
                <span className="text-[11px] font-mono text-neutral-500">Excel PERCENTILE.INC</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {formulaDescription}
              </p>
              <div className="mt-2 text-[11px] text-neutral-500 font-mono bg-neutral-200/50 p-1.5 rounded">
                k = p × (N - 1); i = ⌊k⌋; f = k - i; value = A[i] + f(A[i+1] - A[i])
              </div>
            </div>
          </div>

          {levelUsed && (
            <div className="text-xs text-neutral-800 bg-neutral-100 border border-neutral-300 p-3 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-neutral-900">Calculation Confidence Level: </span>
                <span className="text-neutral-700 font-medium">{levelUsed}</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                {rowsUsed.length.toLocaleString()} underlying listings audited
              </span>
            </div>
          )}

          {customNotes && (
            <div className="text-xs text-neutral-600 bg-amber-50/70 border border-amber-200/80 p-3 rounded-md">
              <span className="font-semibold text-amber-900">Note: </span>
              {customNotes}
            </div>
          )}

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search listings by ID, neighborhood..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">
                Showing {filteredAndSortedRows.length} {filteredAndSortedRows.length === 1 ? 'row' : 'rows'}
              </span>
              <button
                onClick={() => downloadListingsCsv(`dc_airbnb_${tabName.toLowerCase()}_data`, filteredAndSortedRows)}
                disabled={rowsUsed.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>Download CSV ({rowsUsed.length})</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-neutral-200 rounded-lg overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 select-none">
                  <th onClick={() => handleSort('id')} className="py-2.5 px-3 font-semibold cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center gap-1">Listing ID <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('neighbourhood_cleansed')} className="py-2.5 px-3 font-semibold cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center gap-1">Neighborhood <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('room_type')} className="py-2.5 px-3 font-semibold cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center gap-1">Room Type <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('bedrooms')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Beds <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('price')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Price <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('number_of_reviews_ltm')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Reviews LTM <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('review_scores_rating')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Rating <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('estimated_occupancy_l365d')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Est. Nights <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                  <th onClick={() => handleSort('estimated_revenue_l365d')} className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900">
                    <div className="flex items-center justify-end gap-1">Est. Revenue <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2 px-3 font-mono text-neutral-600 whitespace-nowrap">#{row.id}</td>
                      <td className="py-2 px-3 text-neutral-900 max-w-[200px] truncate" title={row.neighbourhood_cleansed}>
                        {row.neighbourhood_cleansed}
                      </td>
                      <td className="py-2 px-3 text-neutral-700 whitespace-nowrap">{row.room_type}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {row.bedrooms !== null ? row.bedrooms : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-neutral-900">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {row.number_of_reviews_ltm !== null ? row.number_of_reviews_ltm : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {row.review_scores_rating !== null ? row.review_scores_rating.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {row.estimated_occupancy_l365d !== null ? `${formatNumber(row.estimated_occupancy_l365d)}d` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {formatCurrency(row.estimated_revenue_l365d)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-neutral-500 italic">
                      No listings match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-neutral-600 pt-2">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
