import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

let _store = null

export const injectStore = (store) => {
  _store = store
}

api.interceptors.request.use((config) => {
  if (!_store) return config

  const { token, ownerToken } = _store.getState().auth
  const isOwnerRoute = config.url?.startsWith('/owners') || config.url?.startsWith('/auth/owners')
  const resolvedToken = isOwnerRoute ? (ownerToken || token) : token

  if (resolvedToken) {
    config.headers.Authorization = `Bearer ${resolvedToken}`
  }

  return config
})

export default api
