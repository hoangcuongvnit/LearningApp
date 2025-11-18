const API_URL = 'https://aznet.io.vn'

export interface ApiError {
  message: string
  status: number
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
    throw new Error(errorMessage)
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export async function get<T>(endpoint: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return handleResponse<T>(res)
}

export async function post<T>(endpoint: string, body?: any, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(res)
}

export async function put<T>(endpoint: string, body?: any, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(res)
}

export async function del<T>(endpoint: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  return handleResponse<T>(res)
}

// Legacy graphql function for backwards compatibility during migration
export async function graphql(query: string, variables?: any, token?: string) {
  throw new Error('GraphQL is deprecated. Please use REST API endpoints.')
}

export default { get, post, put, del, graphql }
