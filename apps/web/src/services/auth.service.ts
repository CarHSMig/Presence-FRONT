import type { LoginRequest, LoginResponse } from '@/types/auth';
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
  }

  public isAuthenticated(): boolean {
    return this.token !== null;
  }
}
