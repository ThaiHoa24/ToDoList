import axios from "axios";
import { getAuthToken } from "@/lib/auth";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Base Endpoint cho Categories theo backend NestJS (/api/categories)
export const CATEGORIES_URL = `${BASE_URL}/api/categories`;
export const CREATE_CATEGORY_URL = CATEGORIES_URL; // Alias tương thích ngược

export interface CreateCategoryPayload {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export interface CategoryResponseData {
  id: number | string;
  user_id?: number | string;
  name: string;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryResponse {
  success?: boolean;
  data?: CategoryResponseData;
  id?: number | string;
  name?: string;
  color?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

/**
 * Lấy danh sách category của user hiện tại
 * GET /api/categories
 */
export const getCategoriesApi = async (
  token?: string | null
): Promise<CategoryResponseData[]> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.get(CATEGORIES_URL, config);
  const data = response.data;
  return Array.isArray(data) ? data : ((data as { data?: CategoryResponseData[] })?.data ?? []);
};

/**
 * Gọi API tạo Category mới
 * POST /api/categories
 */
export const createCategoryApi = async (
  data: CreateCategoryPayload,
  token?: string | null
): Promise<CreateCategoryResponse> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.post<CategoryResponseData>(
    CATEGORIES_URL,
    data,
    config
  );

  const raw = response.data;
  return {
    ...raw,
    data: (raw as { data?: CategoryResponseData })?.data || raw,
  };
};

/**
 * Lấy chi tiết category theo ID
 * GET /api/categories/:id
 */
export const getCategoryByIdApi = async (
  id: number | string,
  token?: string | null
): Promise<CategoryResponseData> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.get(`${CATEGORIES_URL}/${id}`, config);
  const data = response.data;
  return (data as { data?: CategoryResponseData })?.data || data;
};

/**
 * Cập nhật category
 * PATCH /api/categories/:id
 */
export const updateCategoryApi = async (
  id: number | string,
  data: UpdateCategoryPayload,
  token?: string | null
): Promise<CategoryResponseData> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.patch(
    `${CATEGORIES_URL}/${id}`,
    data,
    config
  );
  const resData = response.data;
  return (resData as { data?: CategoryResponseData })?.data || resData;
};

/**
 * Xóa category
 * DELETE /api/categories/:id
 */
export const deleteCategoryApi = async (
  id: number | string,
  token?: string | null
): Promise<{ success?: boolean; [key: string]: unknown }> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.delete(
    `${CATEGORIES_URL}/${id}`,
    config
  );
  return response.data;
};
