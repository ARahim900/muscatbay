"use client"

import { useState, useEffect } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface CacheOptions {
  expirationTime?: number // in milliseconds
}

export function useWaterDataCache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { expirationTime = 5 * 60 * 1000 } = options // Default 5 minutes

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Check if we have cached data
        const cachedData = localStorage.getItem(`water-cache-${key}`)

        if (cachedData) {
          const { data, timestamp }: CacheEntry<T> = JSON.parse(cachedData)
          const now = Date.now()

          // If the cache is still valid, use it
          if (now - timestamp < expirationTime) {
            console.log(`Using cached data for ${key}`)
            setData(data)
            setIsLoading(false)
            return
          }
        }

        // Otherwise fetch fresh data
        console.log(`Fetching fresh data for ${key}`)
        const result = await fetcher()

        // Cache the result
        const cacheEntry: CacheEntry<T> = {
          data: result,
          timestamp: Date.now(),
        }

        localStorage.setItem(`water-cache-${key}`, JSON.stringify(cacheEntry))

        setData(result)
      } catch (err) {
        console.error(`Error fetching data for ${key}:`, err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [key, fetcher, expirationTime])

  const invalidateCache = () => {
    localStorage.removeItem(`water-cache-${key}`)
  }

  return { data, isLoading, error, invalidateCache }
}
