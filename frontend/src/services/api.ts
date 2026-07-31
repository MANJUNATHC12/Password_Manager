import axios from 'axios'

let rawUrl = ''

if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  rawUrl = 'http://localhost:8000/api/v1'
} else {
  rawUrl = import.meta.env.VITE_API_URL || 'https://password-manager-api-t8m3.onrender.com/api/v1'
}

// Strip trailing slashes
rawUrl = rawUrl.replace(/\/+$/, '')

// Extract root host domain (without /api/v1)
const rootHost = rawUrl.replace(/\/api\/v1\/?$/, '')

export const api = axios.create({
  baseURL: rootHost,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: rootHost,
  withCredentials: true,
})

function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  }
}

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

api.interceptors.request.use((config) => {
  if (config.url) {
    const cleanPath = config.url.startsWith('/') ? config.url : `/${config.url}`
    if (!cleanPath.startsWith('/api/v1')) {
      config.url = `/api/v1${cleanPath}`
    }
  }
  const { access } = getTokens()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

const retried = new WeakSet<object>()
let isRefreshing = false
let pending: Array<(token: string | null) => void> = []

function clearSession() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  setAuthHeader(null)
  window.dispatchEvent(new Event('auth:logout'))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (
      !original ||
      retried.has(original) ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error)
    }
    retried.add(original)

    const { refresh } = getTokens()
    if (!refresh) {
      clearSession()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pending.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          } else {
            reject(error)
          }
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await refreshClient.post('/api/v1/auth/refresh', {
        refresh_token: refresh,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      setAuthHeader(data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      pending.forEach((cb) => cb(data.access_token))
      pending = []
      return api(original)
    } catch {
      clearSession()
      pending.forEach((cb) => cb(null))
      pending = []
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
