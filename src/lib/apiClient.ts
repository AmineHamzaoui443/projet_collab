import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios'

const devBase = '/api'
// In production, prefer an explicit `VITE_API_URL` set at build time.
// If it's not set (or points to a localhost URL by mistake), fall back
// to a relative `/api` path so the static server can proxy requests to
// the backend (recommended for OpenShift). This prevents accidentally
// baking a `http://localhost:3000` dev URL into production bundles.
const rawProd = (import.meta.env.VITE_API_URL ?? '').trim()
const prodBase = (rawProd && !/localhost|127\.0\.0\.1/.test(rawProd)) ? rawProd : '/api'

const baseURL = (import.meta.env.MODE === 'development') ? devBase : prodBase

// Create axios instance (increase timeout to tolerate slower local setups)
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s
})

// Debug helpers: log baseURL and wire interceptors so the browser console shows requests/responses
if (typeof window !== 'undefined') {
  // show which baseURL the client is using
  console.info('[apiClient] baseURL:', baseURL, 'MODE:', import.meta.env.MODE)

  api.interceptors.request.use((cfg: AxiosRequestConfig) => {
    console.debug(`[apiClient] ${new Date().toISOString()} request ->`, cfg.method?.toUpperCase(), cfg.baseURL + (cfg.url || ''), cfg.data ?? '')
    try {
      const token = localStorage.getItem('token')
      if (token) {
        cfg.headers = cfg.headers ?? {}
        ;(cfg.headers as Record<string, string>)['authorization'] = `Bearer ${token}`
      } else {
        // Dev-time fallback: if no JWT token is present but a sessionUser exists
        // keep attaching the legacy x-session-user header so local dev flows continue
        const s = localStorage.getItem('sessionUser')
        if (s) {
          cfg.headers = cfg.headers ?? {}
          ;(cfg.headers as Record<string, string>)['x-session-user'] = s
        }
      }
    } catch {
      // ignore
    }
    return cfg
  }, (err) => {
    console.error('[apiClient] request error ->', err)
    return Promise.reject(err)
  })

  api.interceptors.response.use((res) => {
    console.debug(`[apiClient] ${new Date().toISOString()} response <-`, res.status, res.config.url, res.data)
    return res
  }, (err) => {
    
    try {
      const aerr = err as AxiosError
      console.error(`[apiClient] ${new Date().toISOString()} response error <-`, aerr?.response?.status, aerr?.config?.url, aerr?.message)
    } catch {
      console.error('[apiClient] response error (unexpected)', err)
    }
    return Promise.reject(err)
  })
}

export default api as AxiosInstance
