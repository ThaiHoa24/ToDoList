import axios from "axios";
import { getAuthToken } from "@/lib/auth";

// Base URL: Mặc định "" (relative path) để Next.js proxy rewrites chuyển tiếp tới backend,
// giúp tránh triệt để lỗi CORS khi truy cập qua localhost, IP LAN, hay thiết bị khác.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Đường dẫn API tạo task (theo Swagger: POST /api/v1/tasks)
export const CREATE_TASK_URL = `${BASE_URL}/api/v1/tasks`;

export interface CreateTaskPayload {
  title: string;
  notes?: string | null;
  category_id?: string | null;
  status?: "todo" | "in_progress" | "in_review" | "done";
  priority?: "low" | "medium" | "high";
  deadline?: string | null;
}

export interface TaskResponseData {
  id: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  notes?: string | null;
  is_completed: boolean;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high";
  deadline?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskResponse {
  success: boolean;
  data: TaskResponseData;
  meta?: Record<string, unknown>;
}

/**
 * Gọi API tạo task mới bằng axios
 * @param data Dữ liệu task cần tạo
 * @param token Token xác thực (nếu không truyền sẽ tự lấy từ getAuthToken())
 */
export const createTaskApi = async (
  data: CreateTaskPayload,
  token?: string | null
): Promise<CreateTaskResponse> => {
  const authToken = token ?? getAuthToken();
  const config = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  const response = await axios.post<CreateTaskResponse>(
    CREATE_TASK_URL,
    data,
    config
  );
  return response.data;
};
