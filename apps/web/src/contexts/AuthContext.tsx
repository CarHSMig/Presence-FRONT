"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, User } from '@/types/auth';
import { AuthService } from '@/services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const authService = AuthService.getInstance();
        const storedToken = authService.getToken();
        
        if (storedToken) {
          setToken(storedToken);
          try {
            const userData = authService.getUserData();
            if (userData) {
              setUser(userData);
            }
          } catch (error) {
            console.warn('Token inválido, fazendo logout');
            authService.logout();
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const authService = AuthService.getInstance();
      const response = await authService.login(email, password);
      
      setUser(response.data.attributes);
      setToken(authService.getToken());
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    const authService = AuthService.getInstance();
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
