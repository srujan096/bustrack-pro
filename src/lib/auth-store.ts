// Shared in-memory token store used across API routes
const activeTokens = new Map<string, { userId: string; role: string; expiresAt: number }>();

// Cleanup expired tokens periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of activeTokens) {
      if (data.expiresAt < now) activeTokens.delete(token);
    }
  }, 60000);
}

export function getActiveTokens() {
  return activeTokens;
}

export function setToken(token: string, data: { userId: string; role: string; expiresAt: number }) {
  activeTokens.set(token, data);
}

export function removeToken(token: string) {
  activeTokens.delete(token);
}

export function verifyToken(token: string): { userId: string; role: string; expiresAt: number } | undefined {
  const data = activeTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    return undefined;
  }
  return data;
}
