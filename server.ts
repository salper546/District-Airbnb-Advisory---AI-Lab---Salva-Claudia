import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // Initialize Gemini client server-side
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // API endpoint for Advisor Summary on Tabs 2 and 3
  app.post('/api/advisor-summary', async (req, res) => {
    try {
      const { tab, filters, metrics } = req.body;

      if (!metrics) {
        return res.status(400).json({ error: 'Missing metrics for summary generation.' });
      }

      // Sanitize metrics so every numerical value and dollar string is rounded to the nearest integer dollar
      const roundedMetrics: Record<string, any> = {};
      for (const [k, v] of Object.entries(metrics)) {
        if (typeof v === 'number') {
          roundedMetrics[k] = Math.round(v);
        } else if (typeof v === 'string') {
          // Round any decimals in dollar ranges e.g. "$140.20 - $225.80" -> "$140 - $226"
          roundedMetrics[k] = v.replace(/\$(\d+(?:\.\d+)?)/g, (_, num) => `$${Math.round(parseFloat(num)).toLocaleString()}`);
        } else {
          roundedMetrics[k] = v;
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const isValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

      const fallbackSummary =
        tab === 'pricing'
          ? `In ${filters?.neighborhood || 'this neighborhood'}, comparable listings show a median nightly rate of $${roundedMetrics.recommendedMedianPriceUSD ?? '—'}, with the middle 50% ranging between $${roundedMetrics.p25PriceUSD ?? '—'} and $${roundedMetrics.p75PriceUSD ?? '—'}. Across Washington DC for similar properties, the citywide benchmark median is $${roundedMetrics.dcWideMedianPriceUSD ?? '—'} per night. Your active selection currently includes ${roundedMetrics.comparableListingsCount ?? '—'} comparable listings.`
          : `For ${filters?.neighborhood || 'this neighborhood'}, active comparable listings demonstrate an annual median of ${roundedMetrics.medianEstimatedNightsBookedPerYear ?? '—'} booked nights, translating to roughly ${roundedMetrics.medianEstimatedNightsBookedPerMonth ?? '—'} nights per month. Estimated annual gross revenue medians stand at $${roundedMetrics.medianEstimatedAnnualRevenueUSD ? Number(roundedMetrics.medianEstimatedAnnualRevenueUSD).toLocaleString() : '—'}, with the middle 50% of listings earning between ${roundedMetrics.revenueRangeP25toP75USD || '—'}. Across all similar properties in DC overall, the citywide median annual revenue benchmark is $${roundedMetrics.dcWideMedianAnnualRevenueUSD ? Number(roundedMetrics.dcWideMedianAnnualRevenueUSD).toLocaleString() : '—'}.`;

      if (!isValidKey) {
        return res.json({
          summary: fallbackSummary,
          sentData: { tab, filters, metrics: roundedMetrics },
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Here are the verified calculations and filters from the Washington DC Airbnb dataset:
Tab Context: ${tab === 'pricing' ? 'Nightly Pricing Analysis (Tab 2)' : 'Bookings and Revenue Performance (Tab 3)'}
Filters Applied:
- Neighborhood: ${filters?.neighborhood || 'All DC / Selected Neighborhood'}
- Bedrooms: ${filters?.bedrooms || 'Any'}
- Room Type: ${filters?.roomType || 'Any'}
- Property Type: ${filters?.propertyType || 'Any'}

Calculated Numbers:
${JSON.stringify(roundedMetrics, null, 2)}

Write exactly three concise, natural plain-English sentences an advisor could say directly to the homeowner.
MANDATORY FORMATTING: Round EVERY dollar amount and currency value strictly to the nearest whole integer dollar (e.g., $175, not $175.25 or $175.00). Never include decimal cents. Describe ONLY these numbers, make zero promises or external claims.`;

      let summaryText = '';
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 5s')), 5000)
        );
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a professional, objective property management advisor in Washington, DC speaking to a homeowner considering listing their residential property on Airbnb. STRICT RULES:\n1. You must write EXACTLY three plain-English sentences that an advisor could say to the owner.\n2. You may ONLY describe and summarize the exact numbers and filters provided.\n3. MANDATORY: Round EVERY dollar amount and currency value strictly to the nearest whole dollar (e.g. $175, not $175.25). Never output decimal cents.\n4. You MUST NEVER make predictions, promises, or claims about future demand, market growth, guest behavior, seasonality, conversion rates, or anything not in the numbers.\n5. Output ONLY the three sentences in plain text without markdown bullets, asterisks, or quotes.',
          },
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        summaryText = (response.text ?? '').trim();
      } catch (genErr: any) {
        console.warn('Gemini call failed or timed out; utilizing verified factual baseline:', genErr.message);
        summaryText = fallbackSummary;
      }

      return res.json({ summary: summaryText, sentData: { tab, filters, metrics: roundedMetrics } });
    } catch (err: any) {
      console.error('Advisor summary generation error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate advisor summary from Gemini API.',
      });
    }
  });

  // Vite development middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`District Advisory server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
