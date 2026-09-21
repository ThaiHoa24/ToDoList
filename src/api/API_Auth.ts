import axios from "axios";

// Lấy Base URL từ biến môi trường NEXT_PUBLIC_API_URL trong .env.local
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Đường dẫn đầy đủ khi gọi API đăng ký
export const REGISTER_URL = `${BASE_URL}/api/v1/auth/register`;

// Đường dẫn đầy đủ khi gọi API đăng nhập (theo Swagger /api/v1/auth/login)
export const LOGIN_URL = `${BASE_URL}/api/v1/auth/login`;

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