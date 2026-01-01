// Authentication API functions
import { postJson, getJson, ApiError } from "./api";

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  email_verified: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return postJson<RegisterResponse>("v1/auth/register", data, { useCache: false });
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return postJson<LoginResponse>("v1/auth/login", data, { useCache: false });
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  return postJson<VerifyEmailResponse>("v1/auth/verify-email", data, { useCache: false });
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshTokenStr = sessionStorage.getItem("refresh_token");
  if (!refreshTokenStr) {
    throw new ApiError("No refresh token available");
  }
  return postJson<RefreshTokenResponse>("v1/auth/refresh", { refresh_token: refreshTokenStr }, { useCache: false });
}

export async function getCurrentUser(): Promise<UserResponse> {
  return getJson<UserResponse>("v1/auth/me", { useCache: false });
}

