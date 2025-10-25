export interface LoginRequest {
  user: {
    email: string;
    password: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  data: {
    id: string;
    type: string; 
    attributes: User;
  };
  jsonapi: {
    version: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
