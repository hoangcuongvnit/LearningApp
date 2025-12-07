const TOKEN_KEY = 'learningapp_token'
const REFRESH_TOKEN_KEY = 'learningapp_refresh_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(refreshToken: string) {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } catch {}
}

export function clearRefreshToken() {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {}
}

export function setTokens(token: string, refreshToken: string) {
  setToken(token)
  setRefreshToken(refreshToken)
}

export function clearTokens() {
  clearToken()
  clearRefreshToken()
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export default { 
  getToken, 
  setToken, 
  clearToken, 
  getRefreshToken, 
  setRefreshToken, 
  clearRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated 
}
