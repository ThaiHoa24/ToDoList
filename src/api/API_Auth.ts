import axios from "axios";

// Base URL: Mặc định "" (relative path) để Next.js proxy rewrites chuyển tiếp tới backend,
// giúp tránh triệt để lỗi CORS khi truy cập qua localhost, IP mạng LAN (10.36.120.123), hay thiết bị khác.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Đường dẫn đầy đủ khi gọi API đăng ký
export const REGISTER_URL = `${BASE_URL}/api/v1/auth/register`;

// Đường dẫn đầy đủ khi gọi API đăng nhập (theo Swagger /api/v1/auth/login)
export const LOGIN_URL = `${BASE_URL}/api/v1/auth/login`;

// Đường dẫn đầy đủ khi gọi API đăng xuất (theo Swagger /api/v1/auth/logout)
export const LOGOUT_URL = `${BASE_URL}/api/v1/auth/logout`;

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerApi = async (data: RegisterPayload) => {
  const response = await axios.post(REGISTER_URL, data);
  return response.data;
};

export const loginApi = async (data: LoginPayload) => {
  const response = await axios.post(LOGIN_URL, data);
  return response.data;
};

export const logoutApi = async (token?: string | null) => {
  const config = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined;
  const response = await axios.post(LOGOUT_URL, {}, config);
    return response.data;
};