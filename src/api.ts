const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://localhost:3001' : '')

export const getApiBase = () => API_BASE

export const apiRequest = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options)
  let data: T | { message?: string }

  try {
    data = await response.json()
  } catch {
    data = {} as T
  }

  if (!response.ok) {
    const message = (data as { message?: string }).message || 'Request failed'
    throw new Error(message)
  }

  return data as T
}
