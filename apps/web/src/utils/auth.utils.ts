export const authUtils = {

  saveToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_token');
    }
    return null;
  },

  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
    }
  },

  hasToken: (): boolean => {
    return authUtils.getToken() !== null;
  },

  extractTokenFromHeader: (authHeader: string | null): string | null => {
    if (!authHeader) return null;
    return authHeader.replace('Bearer ', '');
  },
};
