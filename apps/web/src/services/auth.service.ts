import type { LoginRequest, LoginResponse, User } from '@/types/auth';
import { authUtils } from '@/utils/auth.utils';
import { applicationUtils } from '@/utils/application.utils';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    this.token = authUtils.getToken();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(email: string, password: string): Promise<LoginResponse> {
    const requestBody: LoginRequest = {
      user: {
        email,
        password,
      },
    };

    const response = await fetch(`${applicationUtils.getBaseUrl()}/users/sign_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Erro na autenticação: ${response.status} ${response.statusText}`
      );
    }

    const data: LoginResponse = await response.json();
    
    const authHeader = response.headers.get('authorization');
    if (authHeader) {
      this.token = authUtils.extractTokenFromHeader(authHeader);
      if (this.token) {
        authUtils.saveToken(this.token);
        this.saveUserData(data.data.attributes);
      }
    }

    return data;
  }

  public getToken(): string | null {
    return this.token;
  }

  public logout(): void {
    this.token = null;
    authUtils.removeToken();
    this.removeUserData();
  }

  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  public saveUserData(user: User): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_data', JSON.stringify(user));
    }
  }

  public getUserData(): User | null {
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('user_data');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Erro ao fazer parse dos dados do usuário:', error);
          return null;
        }
      }
    }
    return null;
  }

  public removeUserData(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user_data');
    }
  }
}
