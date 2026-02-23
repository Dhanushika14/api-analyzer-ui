export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  
  export interface AuthResponse {
    token: string;
    refreshToken: string;
    email: string;
    firstName: string;
    lastName: string;
  }