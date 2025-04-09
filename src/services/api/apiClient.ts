
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApiRequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  version?: string;
  useCache?: boolean;
  cacheTTL?: number; // in seconds
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
  timestamp: Date;
}

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private apiKey: string | null = null;
  private apiVersion: string;

  constructor(baseUrl: string, apiVersion: string = 'v1') {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Try to load API key on initialization
    this.loadApiKey();
  }

  // Load API key from Supabase
  private async loadApiKey(): Promise<void> {
    try {
      // Use a direct query to get the API key
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('service', 'airtable')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading API key:', error);
        return;
      }

      if (data && data.key) {
        this.apiKey = data.key;
        this.defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
      } else {
        console.warn('API key not found for service: airtable');
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  }

  // Set API key manually if needed
  public setApiKey(key: string): void {
    this.apiKey = key;
    this.defaultHeaders['Authorization'] = `Bearer ${key}`;
  }

  // Change API version
  public setApiVersion(version: string): void {
    this.apiVersion = version;
  }

  // Main request method
  public async request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Check if we have a cached response
    const cacheKey = this.getCacheKey(config);
    if (config.useCache && cache[cacheKey]) {
      const cachedData = cache[cacheKey];
      const now = Date.now();
      const ttl = (config.cacheTTL || 300) * 1000; // Default 5 minutes
      
      if (now - cachedData.timestamp < ttl) {
        return {
          data: cachedData.data,
          error: null,
          status: 200,
          timestamp: new Date(cachedData.timestamp)
        };
      }
    }

    try {
      const url = this.buildUrl(config.endpoint, config.params, config.version);
      
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...(config.headers || {})
        },
        body: config.method !== 'GET' && config.body ? JSON.stringify(config.body) : undefined
      });

      const status = response.status;
      
      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Request failed with status ${status}`);
      }

      // Parse JSON response
      const data = await response.json();
      
      // Cache the successful response if caching is enabled
      if (config.useCache) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now()
        };
      }

      return {
        data,
        error: null,
        status,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Show toast notification for user feedback
      toast.error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        status: 500,
        timestamp: new Date()
      };
    }
  }

  // Helper to build the full URL with endpoint, params and version
  private buildUrl(endpoint: string, params?: Record<string, string>, version?: string): string {
    const apiVersion = version || this.apiVersion;
    let url = `${this.baseUrl}/${apiVersion}/${endpoint}`;
    
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        queryParams.append(key, params[key]);
      }
      url += `?${queryParams.toString()}`;
    }
    
    return url;
  }

  // Generate a cache key for a request
  private getCacheKey(config: ApiRequestConfig): string {
    return `${config.method || 'GET'}-${config.endpoint}-${JSON.stringify(config.params || {})}-${config.version || this.apiVersion}`;
  }

  // Convenience methods for different HTTP methods
  public async get<T>(endpoint: string, params?: Record<string, string>, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'GET',
      params,
      ...(options || {})
    });
  }

  public async post<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'POST',
      body,
      ...(options || {})
    });
  }

  public async put<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'PUT',
      body,
      ...(options || {})
    });
  }

  public async delete<T>(endpoint: string, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'DELETE',
      ...(options || {})
    });
  }
  
  public async patch<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      endpoint,
      method: 'PATCH',
      body,
      ...(options || {})
    });
  }

  // Clear entire cache or just for a specific endpoint
  public clearCache(endpoint?: string): void {
    if (endpoint) {
      const prefix = `GET-${endpoint}`;
      Object.keys(cache).forEach(key => {
        if (key.startsWith(prefix)) {
          delete cache[key];
        }
      });
    } else {
      Object.keys(cache).forEach(key => delete cache[key]);
    }
  }
}

// Create default instance for Airtable
export const airtableApi = new ApiClient('https://api.airtable.com');

// Export a function to create new API clients for other services
export const createApiClient = (baseUrl: string, apiVersion?: string) => {
  return new ApiClient(baseUrl, apiVersion);
};
