import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdvisorSummaryCardProps {
  tab: 'pricing' | 'bookings';
  filters: Record<string, any>;
  metrics: Record<string, any>;
  autoFetch?: boolean;
}

export const AdvisorSummaryCard: React.FC<AdvisorSummaryCardProps> = ({
  tab,
  filters,
  metrics,
  autoFetch = true,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSentData, setShowSentData] = useState(false);
  const [lastSentData, setLastSentData] = useState<any>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      tab,
      filters,
      metrics,
    };

    setLastSentData(payload);

    try {
      const res = await fetch('/api/advisor-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Advisor summary fetch error:', err);
      setError(
        err.message ||
          'Unable to generate advisor talking points. Please verify that GEMINI_API_KEY is configured in Settings > Secrets.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSummary();
    }
  }, [tab, JSON.stringify(filters), JSON.stringify(metrics)]);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Advisor Executive Summary</h3>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          title="Regenerate advisor sentences from calculated data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Refresh Summary'}</span>
        </button>
      </div>

      {loading && !summary && (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-neutral-500">Synthesizing executive summary from calculated metrics...</p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50/70 border border-red-200 text-red-800 rounded-md text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Advisor Summary Notice</p>
            <p className="mt-0.5 text-red-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-md p-4 text-neutral-800">
          <div className="flex items-start gap-3">
            <div className="text-neutral-400 font-serif text-2xl leading-none select-none">“</div>
            <p className="text-sm leading-relaxed text-neutral-800 font-normal">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Audit trail: Exact data sent to Gemini */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          onClick={() => setShowSentData(!showSentData)}
          className="flex items-center justify-between w-full text-left text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors py-1"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Inspection: View the exact numbers sent to the Gemini model</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span>{showSentData ? 'Hide input payload' : 'Show input payload'}</span>
            {showSentData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showSentData && (
          <div className="mt-3 p-3 bg-neutral-900 text-neutral-200 rounded-md font-mono text-xs overflow-x-auto">
            <div className="text-[11px] text-neutral-400 mb-1 border-b border-neutral-800 pb-1">
              // Strict prompt constraint: Only these calculated metrics were sent. No external claims or speculation allowed.
            </div>
            <pre className="text-[11px] leading-relaxed custom-scrollbar max-h-48">
              {JSON.stringify(lastSentData || { filters, metrics }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
