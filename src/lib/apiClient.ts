import axios from 'axios'

const devBase = '/api'
const prodBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
  // eslint-disable-next-line no-console
  console.info('[apiClient] baseURL:', baseURL, 'MODE:', import.meta.env.MODE)

  api.interceptors.request.use((cfg) => {
    // eslint-disable-next-line no-console
    console.debug(`[apiClient] ${new Date().toISOString()} request ->`, cfg.method?.toUpperCase(), cfg.baseURL + (cfg.url || ''), cfg.data ?? '')
    try {
      const token = localStorage.getItem('token')
      if (token) {
        (cfg.headers as any).authorization = `Bearer ${token}`
      } else {
        // Dev-time fallback: if no JWT token is present but a sessionUser exists
        // keep attaching the legacy x-session-user header so local dev flows continue
        const s = localStorage.getItem('sessionUser')
        if (s) (cfg.headers as any)['x-session-user'] = s
      }
    } catch (e) {
      // ignore
    }
    return cfg
  }, (err) => {
    // eslint-disable-next-line no-console
    console.error('[apiClient] request error ->', err)
    return Promise.reject(err)
  })

  api.interceptors.response.use((res) => {
    // eslint-disable-next-line no-console
    console.debug(`[apiClient] ${new Date().toISOString()} response <-`, res.status, res.config.url, res.data)
    return res
  }, (err) => {
    // eslint-disable-next-line no-console
    try {
      console.error(`[apiClient] ${new Date().toISOString()} response error <-`, err?.response?.status, err?.config?.url, err?.message)
    } catch (e) {
      console.error('[apiClient] response error (unexpected)', err)
    }
    return Promise.reject(err)
  })
}

export default api
