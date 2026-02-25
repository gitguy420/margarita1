import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { buildChart, buildNarrative, buildSynastry } from './astro/astro.js';
import { loadCities, listRegions, listCitiesByRegion } from './data/cities.js';
import { renderReport } from './templates/report.js';

const app = express();
const PORT = process.env.PORT || 4100;
const BRAND = process.env.BRAND_NAME || 'Маргарита';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors(
    ALLOWED_ORIGINS.length
      ? {
          origin(origin, callback) {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
              return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
          }
        }
      : undefined
  )
);
app.use(express.json({ limit: '2mb' }));

const { cities, error: citiesError } = loadCities();

app.get('/api/status', (req, res) => {
  res.json({ ok: true, citiesLoaded: cities.length, citiesError });
});

app.get('/api/regions', (req, res) => {
  if (citiesError) return res.status(500).json({ error: citiesError });
  res.json(listRegions(cities));
});

app.get('/api/cities', (req, res) => {
  if (citiesError) return res.status(500).json({ error: citiesError });
  const region = req.query.region;
  if (!region) return res.status(400).json({ error: 'region is required' });
  res.json(listCitiesByRegion(cities, region));
});

app.post('/api/report', async (req, res) => {
  try {
    const { partnerA, partnerB } = req.body || {};
    if (!partnerA || !partnerB) {
      return res.status(400).json({ error: 'partnerA and partnerB required' });
    }

    const enrichLocation = (p) => {
      const match = cities.find((c) => c.region === p.location.region && c.name === p.location.city);
      if (!match) return p;
      return { ...p, location: { ...p.location, lat: match.lat, lon: match.lon } };
    };

    const enrichedA = enrichLocation(partnerA);
    const enrichedB = enrichLocation(partnerB);

    if (!enrichedA.location.lat || !enrichedA.location.lon) {
      return res.status(400).json({ error: 'Не удалось определить координаты для партнёра A' });
    }
    if (!enrichedB.location.lat || !enrichedB.location.lon) {
      return res.status(400).json({ error: 'Не удалось определить координаты для партнёра B' });
    }

    const chartA = buildChart(enrichedA);
    const chartB = buildChart(enrichedB);
    const synastry = buildSynastry(chartA, chartB);
    const narrative = buildNarrative({ chartA, chartB, synastry });

    const html = renderReport({ chartA, chartB, synastry, narrative, brandName: BRAND });

    const launchOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check'
      ],
      headless: 'new',
      timeout: 0,
      protocolTimeout: 60000
    };
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="synastry-report.pdf"');
    const pdfBuffer = Buffer.from(pdf);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
