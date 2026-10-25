import axios from "axios";
import { getAuthToken } from "@/lib/auth";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const TASKS_URL = `${BASE_URL}/api/tasks`;

export type TaskStatusBE = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriorityBE = "LOW" | "MEDIUM" | "HIGH";

export type TaskStatusFE = "todo" | "progress" | "review" | "done";
export type TaskPriorityFE = "low" | "medium" | "high";

export interface TaskQueryParams {
  status?: string;
  search?: string;
  categoryId?: number | string;
  priority?: string;
  view?: "today" | "upcoming" | "overdue" | string;
  sort?: "createdAt" | "deadline" | "priority" | "title" | string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  notes?: string | null;
  categoryId?: number | string | null;
  category_id?: number | string | null;
  status?: TaskStatusFE | TaskStatusBE;
  priority?: TaskPriorityFE | TaskPriorityBE;
  deadline?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  notes?: string | null;
  categoryId?: number | string | null;
  category_id?: number | string | null;
  status?: TaskStatusFE | TaskStatusBE;
  priority?: TaskPriorityFE | TaskPriorityBE;
  deadline?: string | null;
}

export interface BackendTask {
  id: number | string;
  user_id?: number | string;
  userId?: number | string;
  category_id?: number | string | null;
  categoryId?: number | string | null;
  title: string;
  notes?: string | null;
  status: TaskStatusBE | TaskStatusFE;
  priority: TaskPriorityBE | TaskPriorityFE;
  deadline?: string | null;
  completed_at?: string | null;
  completedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  category?: {
    id: number | string;
    name: string;
    color?: string | null;
    icon?: string | null;
  } | null;
}

export interface TasksListResponse {
  success?: boolean;
  data: BackendTask[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleTaskResponse {
  success?: boolean;
  data: BackendTask;
}

// Helpers mapping Frontend <-> Backend
export function mapStatusToBE(status?: TaskStatusFE | TaskStatusBE): TaskStatusBE {
  if (!status) return "TODO";
  const s = status.toUpperCase();
  if (s === "PROGRESS" || s === "IN_PROGRESS") return "IN_PROGRESS";
  if (s === "REVIEW" || s === "IN_REVIEW") return "REVIEW";
  if (s === "DONE") return "DONE";
  return "TODO";
}

export function mapStatusToFE(status?: string): TaskStatusFE {
  if (!status) return "todo";
  const s = status.toUpperCase();
  if (s === "IN_PROGRESS" || s === "PROGRESS") return "progress";
  if (s === "REVIEW" || s === "IN_REVIEW") return "review";
  if (s === "DONE") return "done";
  return "todo";
}

export function mapPriorityToBE(priority?: TaskPriorityFE | TaskPriorityBE): TaskPriorityBE {
  if (!priority) return "MEDIUM";
  const p = priority.toUpperCase();
  if (p === "HIGH") return "HIGH";
  if (p === "LOW") return "LOW";
  return "MEDIUM";
}

export function mapPriorityToFE(priority?: string): TaskPriorityFE {
  if (!priority) return "medium";
  const p = priority.toLowerCase();
  if (p === "high") return "high";
  if (p === "low") return "low";
  return "medium";
}

function getAuthConfig(token?: string | null) {
  const authToken = token ?? getAuthToken();
  return authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;
}

/**
 * Lấy danh sách tasks từ backend (hỗ trợ filter, search, sort, paging)
 * GET /api/tasks
 */
export const getTasksApi = async (
  params?: TaskQueryParams,
  token?: string | null
): Promise<BackendTask[]> => {
  const config = getAuthConfig(token);
  const response = await axios.get(TASKS_URL, {
    ...config,
    params,
  });

  const resData = response.data;
  if (Array.isArray(resData)) {
    return resData;
  }
  if (Array.isArray(resData?.data)) {
    return resData.data;
  }
  return [];
};

/**
 * Tạo task mới
 * POST /api/tasks
 */
export const createTaskApi = async (
  data: CreateTaskPayload,
  token?: string | null
): Promise<SingleTaskResponse> => {
  const config = getAuthConfig(token);

  const payload = {
    title: data.title.trim(),
    notes: data.notes?.trim() || null,
    categoryId:
      data.categoryId !== undefined
        ? data.categoryId
        : data.category_id !== undefined
        ? data.category_id
        : null,
    category_id:
      data.category_id !== undefined
        ? data.category_id
        : data.categoryId !== undefined
        ? data.categoryId
        : null,
    status: mapStatusToBE(data.status),
    priority: mapPriorityToBE(data.priority),
    deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
  };

  const response = await axios.post(TASKS_URL, payload, config);
  const raw = response.data;
  return {
    success: true,
    data: (raw as { data?: BackendTask })?.data || raw,
  };
};

/**
 * Lấy chi tiết task theo ID
 * GET /api/tasks/:id
 */
export const getTaskByIdApi = async (
  id: number | string,
  token?: string | null
): Promise<BackendTask> => {
  const config = getAuthConfig(token);
  const response = await axios.get(`${TASKS_URL}/${id}`, config);
  const raw = response.data;
  return (raw as { data?: BackendTask })?.data || raw;
};

/**
 * Cập nhật task theo ID
 * PATCH /api/tasks/:id
 */
export const updateTaskApi = async (
  id: number | string,
  data: UpdateTaskPayload,
  token?: string | null
): Promise<BackendTask> => {
  const config = getAuthConfig(token);

  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
  if (data.categoryId !== undefined || data.category_id !== undefined) {
    const catId = data.categoryId ?? data.category_id;
    payload.categoryId = catId ? Number(catId) || catId : null;
    payload.category_id = payload.categoryId;
  }
  if (data.status !== undefined) payload.status = mapStatusToBE(data.status);
  if (data.priority !== undefined) payload.priority = mapPriorityToBE(data.priority);
  if (data.deadline !== undefined) {
    payload.deadline = data.deadline ? new Date(data.deadline).toISOString() : null;
  }

  const response = await axios.patch(`${TASKS_URL}/${id}`, payload, config);
  const raw = response.data;
  return (raw as { data?: BackendTask })?.data || raw;
};

/**
 * Xóa task theo ID
 * DELETE /api/tasks/:id
 */
export const deleteTaskApi = async (
  id: number | string,
  token?: string | null
): Promise<{ success: boolean; deletedId?: number | string }> => {
  const config = getAuthConfig(token);
  const response = await axios.delete(`${TASKS_URL}/${id}`, config);
  const raw = response.data;
  return (raw as { data?: { deletedId?: number | string } })?.data
    ? { success: true, deletedId: (raw as { data?: { deletedId?: number | string } }).data?.deletedId }
    : { success: true, deletedId: id };
};
