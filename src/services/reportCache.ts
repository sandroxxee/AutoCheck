import { ConsolidatedReport } from '../types/index.ts';

/**
 * Cache Storage Configuration
 * Standard TTL: 24 hours (86,400,000 ms) to keep government data fresh while avoiding redundant API calls
 * Max entries: 40 reports (LRU eviction) to preserve localStorage capacity
 */
const CACHE_STORAGE_KEY = 'autocheck_vehicle_reports_cache_v3';
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedReportEntry {
  report: ConsolidatedReport;
  plate: string;
  queryType: string;
  savedAt: number;
  expiresAt: number;
}

type CacheStore = Record<string, CachedReportEntry>;

function getCacheStore(): CacheStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheStore;
  } catch (err) {
    console.warn('Erro ao ler cache de veículos do localStorage:', err);
    return {};
  }
}

function saveCacheStore(store: CacheStore): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Erro ao salvar cache no localStorage:', err);
    // If quota exceeded, clear oldest half of entries
    try {
      const keys = Object.keys(store);
      if (keys.length > 5) {
        const sorted = keys.sort((a, b) => (store[a]?.savedAt || 0) - (store[b]?.savedAt || 0));
        const pruned: CacheStore = {};
        sorted.slice(Math.floor(keys.length / 2)).forEach((k) => {
          if (store[k]) pruned[k] = store[k];
        });
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(pruned));
      }
    } catch {
      // Storage completely full or blocked
    }
  }
}

/**
 * Normalizes a plate key for cache lookup
 */
export function normalizePlateKey(plate: string): string {
  return (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Retrieves a non-expired cached report for a given plate.
 * If a 'complete' report is cached, it will satisfy queries for 'basic' without making an API call.
 */
export function getCachedReport(plate: string, queryType: 'basic' | 'complete' | 'professional' = 'complete'): ConsolidatedReport | null {
  const cleanPlate = normalizePlateKey(plate);
  if (!cleanPlate) return null;

  const store = getCacheStore();
  const now = Date.now();

  // Helper to verify if cached report satisfies complete requirements
  const isReportValidForType = (rep: ConsolidatedReport, reqType: string) => {
    if (!rep) return false;
    if (reqType === 'basic') return true;
    // Complete queries require enriched fields
    return Boolean(rep.fipe && rep.ipva);
  };

  // Check direct key first (e.g. BRA2E19_complete)
  const exactKey = `${cleanPlate}_${queryType}`;
  const exactEntry = store[exactKey];

  if (exactEntry && exactEntry.expiresAt > now && exactEntry.report) {
    if (isReportValidForType(exactEntry.report, queryType)) {
      return exactEntry.report;
    }
  }

  // If searching for basic or complete, check if a complete/professional report is available
  if (queryType === 'basic' || queryType === 'complete') {
    const completeKey = `${cleanPlate}_complete`;
    const completeEntry = store[completeKey];
    if (completeEntry && completeEntry.expiresAt > now && completeEntry.report) {
      if (isReportValidForType(completeEntry.report, queryType)) {
        return completeEntry.report;
      }
    }

    const proKey = `${cleanPlate}_professional`;
    const proEntry = store[proKey];
    if (proEntry && proEntry.expiresAt > now && proEntry.report) {
      if (isReportValidForType(proEntry.report, queryType)) {
        return proEntry.report;
      }
    }
  }

  // Check any non-expired entry for this plate regardless of key suffix
  for (const key of Object.keys(store)) {
    if (key.startsWith(cleanPlate) && store[key]) {
      const entry = store[key];
      if (entry.expiresAt > now && entry.report) {
        // If requested queryType is basic, any report satisfies it
        if (queryType === 'basic') {
          return entry.report;
        }
        // If requested queryType is complete, only valid complete/professional satisfies it
        if ((entry.report.queryType === 'complete' || entry.report.queryType === 'professional') && isReportValidForType(entry.report, queryType)) {
          return entry.report;
        }
      }
    }
  }

  return null;
}

/**
 * Saves or updates a report in local cache with TTL and LRU prune
 */
export function setCachedReport(report: ConsolidatedReport, ttlMs = DEFAULT_CACHE_TTL_MS): void {
  if (!report || !report.plate) return;

  const cleanPlate = normalizePlateKey(report.plate);
  const qType = report.queryType || 'complete';
  const key = `${cleanPlate}_${qType}`;

  const store = getCacheStore();
  const now = Date.now();

  // LRU Pruning if entries exceed 40
  const keys = Object.keys(store);
  if (keys.length >= 40) {
    const oldestKey = keys.reduce((oldest, current) => {
      const oldestTime = store[oldest]?.savedAt || 0;
      const currTime = store[current]?.savedAt || 0;
      return currTime < oldestTime ? current : oldest;
    }, keys[0]);
    if (oldestKey) {
      delete store[oldestKey];
    }
  }

  store[key] = {
    report,
    plate: cleanPlate,
    queryType: qType,
    savedAt: now,
    expiresAt: now + ttlMs
  };

  saveCacheStore(store);
}

/**
 * Removes a plate from cache (useful when forcing a refresh)
 */
export function removeCachedReport(plate: string): void {
  const cleanPlate = normalizePlateKey(plate);
  if (!cleanPlate) return;

  const store = getCacheStore();
  let changed = false;

  for (const key of Object.keys(store)) {
    if (key.startsWith(cleanPlate)) {
      delete store[key];
      changed = true;
    }
  }

  if (changed) {
    saveCacheStore(store);
  }
}

/**
 * Clears all cached reports
 */
export function clearAllCachedReports(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(CACHE_STORAGE_KEY);
}

/**
 * Cleans expired or corrupted entries from cache
 */
export function clearExpiredAndStaleCache(): number {
  const store = getCacheStore();
  const now = Date.now();
  let removedCount = 0;
  let changed = false;

  for (const key of Object.keys(store)) {
    const entry = store[key];
    if (!entry || !entry.report || entry.expiresAt <= now || !entry.plate) {
      delete store[key];
      removedCount++;
      changed = true;
    }
  }

  if (changed) {
    saveCacheStore(store);
  }

  return removedCount;
}

/**
 * Returns all non-expired cached reports for history fallback
 */
export function getAllCachedReports(): ConsolidatedReport[] {
  const store = getCacheStore();
  const now = Date.now();
  const results: ConsolidatedReport[] = [];

  for (const key of Object.keys(store)) {
    const entry = store[key];
    if (entry && entry.expiresAt > now && entry.report) {
      results.push(entry.report);
    }
  }

  return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}
