const TOKEN_KEY = 'learningapp_token'

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

export function isAuthenticated(): boolean {
  return !!getToken()
}

export default { getToken, setToken, clearToken, isAuthenticated }
