import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = process.env.RU_CITIES_PATH || path.join(__dirname, 'ru_cities.json');

function normalizeCity(raw) {
  const name = raw.name || raw.city || raw.title || raw.name_ru || raw.nameRU || raw.name_ru || raw.nameRU || raw.city_name || raw.cityName;
  const region = raw.region || raw.subject || raw.federalSubject || raw.region_name || raw.regionName || raw.province || raw.admin_name || raw.region_ru;
  const lat = Number(
    raw.lat || raw.latitude || raw.geo_lat || raw.lat_dd || (raw.coords && raw.coords.lat)
  );
  const lon = Number(
    raw.lon || raw.lng || raw.longitude || raw.geo_lon || raw.lon_dd || (raw.coords && raw.coords.lon)
  );
  const population = Number(raw.population || raw.pop || raw.population_count || raw.popul);

  if (!name || !region || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    name: String(name).trim(),
    region: String(region).trim(),
    lat,
    lon,
    population: Number.isFinite(population) ? population : null
  };
}

export function loadCities() {
  if (!fs.existsSync(DATA_PATH)) {
    return { cities: [], error: `Файл городов не найден: ${DATA_PATH}` };
  }
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.cities || raw.items || raw.data || [];
  const cities = list.map(normalizeCity).filter(Boolean);
  return { cities, error: null };
}

export function listRegions(cities) {
  const regions = new Map();
  for (const c of cities) {
    if (!regions.has(c.region)) regions.set(c.region, 0);
    regions.set(c.region, regions.get(c.region) + 1);
  }
  return [...regions.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function listCitiesByRegion(cities, region) {
  return cities
    .filter((c) => c.region === region)
    .sort((a, b) => {
      const popA = a.population ?? -1;
      const popB = b.population ?? -1;
      if (popA !== popB) return popB - popA;
      return a.name.localeCompare(b.name, 'ru');
    });
}
