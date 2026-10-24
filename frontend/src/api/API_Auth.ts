import axios from "axios";
import { getAuthToken } from "@/lib/auth";

// Base URL: Mặc định "" (relative path) để Next.js proxy rewrites chuyển tiếp tới backend,
// hoặc nhận NEXT_PUBLIC_API_URL từ .env.local (ví dụ: http://localhost:3001)
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Các endpoint Auth chuẩn theo NestJS Backend (/api/auth/...)
export const REGISTER_URL = `${BASE_URL}/api/auth/register`;
export const LOGIN_URL = `${BASE_URL}/api/auth/login`;
export const LOGOUT_URL = `${BASE_URL}/api/auth/logout`;
export const ME_URL = `${BASE_URL}/api/auth/me`;

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number | string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  access_token: string;
  user: UserResponse;
  data?: {
    accessToken?: string;
    access_token?: string;
    token?: string;
    user?: UserResponse;
  };
  token?: string;
}

export const registerApi = async (data: RegisterPayload) => {
  const response = await axios.post(REGISTER_URL, data);
  return response.data;
};

export const loginApi = async (data: LoginPayload): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(LOGIN_URL, data);
  return response.data;
};

export const logoutApi = async (token?: string | null) => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;
  const response = await axios.post(LOGOUT_URL, {}, config);
  return response.data;
};

export const getMeApi = async (token?: string | null): Promise<UserResponse> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;
  const response = await axios.get<UserResponse>(ME_URL, config);
  return response.data;
};