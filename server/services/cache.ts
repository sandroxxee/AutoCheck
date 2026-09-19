interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class QueryCache {
  private static instance: QueryCache;
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  // TTL in seconds
  public static readonly TTL = {
    THEFT: 3600,       // 1 hour (theft status changes fast)
    BASIC: 86400,      // 24 hours (cadastral data rarely changes)
    FINANCING: 21600,  // 6 hours
    ACCIDENT: 86400,   // 24 hours
    AUCTION: 86400,    // 24 hours
    FINES: 14400,      // 4 hours
    REPORT: 7200       // 2 hours
  };

  private constructor() {
    // Cleanup expired items every 15 minutes
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  public static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  private generateKey(plate: string, moduleName: string): string {
    return `${plate.toUpperCase().trim()}:${moduleName.toLowerCase()}`;
  }

  public get<T>(plate: string, moduleName: string): T | null {
    const key = this.generateKey(plate, moduleName);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(plate: string, moduleName: string, data: T, ttlSeconds: number): void {
    const key = this.generateKey(plate, moduleName);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public invalidate(plate: string): void {
    const prefix = `${plate.toUpperCase().trim()}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  public getStats(): { totalEntries: number } {
    return { totalEntries: this.cache.size };
  }
}

export const queryCache = QueryCache.getInstance();
