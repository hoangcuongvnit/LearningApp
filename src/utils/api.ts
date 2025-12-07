const API_URL = 'https://aznet.io.vn'

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

export interface ApiError {
  message: string
  status: number
}

interface RefreshTokenRequestDto {
  refreshToken: string
}

interface AuthResponseDto {
  email: string
  token: string
  refreshToken: string
  role: string
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

async function refreshAccessToken(): Promise<string | null> {
  const { getRefreshToken, setTokens, clearTokens } = await import('./auth')
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return null
  }

  try {
    const body: RefreshTokenRequestDto = { refreshToken }
    const res = await fetch(`${API_URL}/api/Account/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      // Refresh token is invalid or expired, clear tokens
      clearTokens()
      return null
    }

    const data: AuthResponseDto = await res.json()
    setTokens(data.token, data.refreshToken)
    return data.token
  } catch (error) {
    clearTokens()
    return null
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`
    try {
      const errorData = await res.json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.errors) {
        // Handle validation errors object
        const errors = errorData.errors
        const errorMessages = Object.keys(errors).map(key => {
          const messages = Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]
          return `${key}: ${messages}`
        })
        errorMessage = errorMessages.join(' | ')
      } else if (errorData.title) {
        errorMessage = errorData.title
        // Include detail if available
        if (errorData.detail) {
          errorMessage += `: ${errorData.detail}`
        }
      } else {
        // Fallback: stringify the entire error object
        errorMessage = JSON.stringify(errorData)
      }
    } catch {
      // If parsing fails, use the default error message
    }
    const error: any = new Error(errorMessage)
    error.status = res.status
    throw error
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

async function fetchWithTokenRefresh<T>(
  url: string, 
  options: RequestInit
): Promise<T> {
  let res = await fetch(url, options)
  
  // If 401 Unauthorized, try to refresh the token
  if (res.status === 401) {
    const { getToken } = await import('./auth')
    const currentToken = getToken()
    
    // Only attempt refresh if we have a token (meaning we were authenticated)
    if (currentToken) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false
        
        if (newToken) {
          onRefreshed(newToken)
          
          // Retry the original request with the new token
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${newToken}`)
          
          res = await fetch(url, {
            ...options,
            headers
          })
        } else {
          // Refresh failed, redirect to login
          window.location.reload()
        }
      } else {
        // Wait for the refresh to complete
        const newToken = await new Promise<string>((resolve) => {
          addRefreshSubscriber((token: string) => {
            resolve(token)
          })
        })
        
        // Retry with new token
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${newToken}`)
        
        res = await fetch(url, {
          ...options,
          headers
        })
      }
    }
  }
  
  return handleResponse<T>(res)
}

export async function get<T>(endpoint: string, token?: string): Promise<T> {
  return fetchWithTokenRefresh<T>(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}

export async function post<T>(endpoint: string, body?: any, token?: string): Promise<T> {
  return fetchWithTokenRefresh<T>(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
}

export async function put<T>(endpoint: string, body?: any, token?: string): Promise<T> {
  return fetchWithTokenRefresh<T>(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
}

export async function del<T>(endpoint: string, token?: string): Promise<T> {
  return fetchWithTokenRefresh<T>(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}

// Legacy graphql function for backwards compatibility during migration
export async function graphql(query: string, variables?: any, token?: string) {
  throw new Error('GraphQL is deprecated. Please use REST API endpoints.')
}

export default { get, post, put, del, graphql }
