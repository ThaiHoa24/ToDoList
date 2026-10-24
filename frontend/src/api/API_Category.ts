import axios from "axios";
import { getAuthToken } from "@/lib/auth";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const CREATE_CATEGORY_URL = `${BASE_URL}/api/v1/categories`;

export interface CreateCategoryPayload {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface CategoryResponseData {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  data: CategoryResponseData;
  meta?: Record<string, unknown>;
}

/**
 * Gọi API tạo Category mới
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

  const response = await axios.post<CreateCategoryResponse>(
    CREATE_CATEGORY_URL,
    data,
    config
  );
  return response.data;
};
