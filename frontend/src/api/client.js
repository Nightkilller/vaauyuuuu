/**
 * VaayuLens AI — API Client
 * Axios instance + API call functions for all backend endpoints.
 */

import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Ward endpoints ─────────────────────────────────────────────────
export const fetchWards = (city) => api.get('/api/wards', { params: { city } }).then(res => res.data)

// ── Forecast endpoints ─────────────────────────────────────────────
export const fetchAllForecasts = (city) => api.get('/api/forecast/all', { params: { city } }).then(res => res.data)
export const fetchWardForecast = (wardId) => api.get(`/api/forecast/${wardId}`).then(res => res.data)

// ── Attribution endpoints ──────────────────────────────────────────
export const fetchAttribution = (wardId) => api.get(`/api/attribution/${wardId}`).then(res => res.data)

// ── Priority ranking ───────────────────────────────────────────────
export const fetchPriorityRanking = (city) => api.get('/api/priority-ranking', { params: { city } }).then(res => res.data)

// ── Advisory ───────────────────────────────────────────────────────
export const fetchAdvisory = (wardId) => api.get(`/api/advisory/${wardId}`).then(res => res.data)

export default api
