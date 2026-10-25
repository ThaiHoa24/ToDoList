"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AddTask from "@/components/addtask";
import EditTaskModal from "@/components/edit-task-modal";
import {
  createCategoryApi,
  getCategoriesApi,
  deleteCategoryApi,
} from "@/api/API_Category";
import {
  getTasksApi,
  updateTaskApi,
  deleteTaskApi,
  mapStatusToFE,
  mapPriorityToFE,
  type BackendTask,
} from "@/api/API_Task";
import { getAuthToken } from "@/lib/auth";

export type TaskStatus = "todo" | "progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  categoryId?: string | null;
  title: string;
  notes?: string;
  category: string;
  categoryColor: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  deadlineTone: "neutral" | "today" | "upcoming" | "overdue";
  hasNotes: boolean;
  completed?: boolean;
};

export type AddTaskData = {
  id?: string;
  categoryId?: string;
  categoryColor?: string;
  title: string;
  priority: TaskPriority;
  category: string;
  deadline?: string;
  notes?: string;
};

export type Category = {
  id: string;
  name: string;
  color?: string;
  count: number;
  isNeutral?: boolean;
  isUncategorized?: boolean;
};

export type QuickFilter =
  | "all"
  | "active"
  | "completed"
  | "today"
  | "upcoming"
  | "overdue";

export type SortOption =
  | "newest"
  | "oldest"
  | "deadline"
  | "priority"
  | "title";

type TaskBoardStats = {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
};

type TaskBoardContextValue = {
  tasks: Task[];
  filteredTasks: Task[];
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeFilter: QuickFilter;
  setActiveFilter: (filter: QuickFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  addCategory: (name: string, color?: string) => Promise<Category | null>;
  removeCategory: (id: string) => void;
  addTask: (newTaskData: AddTaskData) => Promise<void>;
  updateTask: (
    id: string,
    data: {
      title?: string;
      notes?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      categoryId?: string | null;
      deadline?: string | null;
    }
  ) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  editingTask: Task | null;
  openEditTask: (task: Task) => void;
  closeEditTask: () => void;
  isLoadingTasks: boolean;
  stats: TaskBoardStats;
  toastMessage: string | null;
  openAddTask: () => void;
  closeAddTask: () => void;
  dismissToast: () => void;
  refreshTasks: () => Promise<void>;
};

const CATEGORY_COLORS = [
  "#2563eb",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0284c7",
];

const TaskBoardContext = createContext<TaskBoardContextValue | null>(null);

function getDeadlineTone(deadline?: string): Task["deadlineTone"] {
  if (!deadline) return "neutral";

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return "neutral";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (deadlineDate.getTime() < todayStart.getTime()) return "overdue";
  if (deadlineDate.getTime() <= todayEnd.getTime()) return "today";
  return "upcoming";
}

function formatDeadline(deadline?: string) {
  if (!deadline) return "No deadline";

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return "No deadline";

  return deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapBackendToTask(bt: BackendTask, categories: Category[]): Task {
  const catId = bt.category_id !== undefined ? bt.category_id : bt.categoryId;
  const matchedCat = categories.find(
    (c) => String(c.id) === String(catId) || (bt.category && bt.category.name.toLowerCase() === c.name.toLowerCase())
  );

  const feStatus = mapStatusToFE(bt.status);
  const fePriority = mapPriorityToFE(bt.priority);
  const isDone = feStatus === "done" || Boolean(bt.completed_at || bt.completedAt);

  return {
    id: String(bt.id),
    categoryId: catId ? String(catId) : null,
    title: bt.title,
    notes: bt.notes || undefined,
    category: matchedCat?.name || bt.category?.name || "General",
    categoryColor: matchedCat?.color || bt.category?.color || "#475569",
    priority: fePriority,
    status: feStatus,
    deadline: formatDeadline(bt.deadline || undefined),
    deadlineTone: getDeadlineTone(bt.deadline || undefined),
    hasNotes: Boolean(bt.notes),
    completed: isDone,
  };
}

export function TaskBoardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // 1. Tải danh sách Categories từ API
  useEffect(() => {
    async function loadCategories() {
      try {
        const token = getAuthToken();
        if (!token) return;
        const remoteCats = await getCategoriesApi(token);
        if (Array.isArray(remoteCats)) {
          setCategories(
            remoteCats.map((cat, idx) => ({
              id: String(cat.id),
              name: cat.name,
              color: cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
              count: 0,
            }))
          );
        }
      } catch (err) {
        console.warn("Could not fetch categories from backend:", err);
      }
    }
    loadCategories();
  }, []);

  // 2. Tải danh sách Tasks từ API
  const refreshTasks = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoadingTasks(false);
      return;
    }

    try {
      setIsLoadingTasks(true);
      const backendTasks = await getTasksApi(undefined, token);
      if (Array.isArray(backendTasks)) {
        setTasks(backendTasks.map((bt) => mapBackendToTask(bt, categories)));
      }
    } catch (err) {
      console.warn("Could not fetch tasks from backend:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [categories]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Đếm số lượng task theo category
  const categoriesWithCounts = useMemo<Category[]>(() => {
    return categories.map((cat) => ({
      ...cat,
      count: tasks.filter(
        (t) =>
          (t.categoryId && String(t.categoryId) === String(cat.id)) ||
          t.category.toLowerCase() === cat.name.toLowerCase()
      ).length,
    }));
  }, [categories, tasks]);

  // Bộ lọc tổng hợp (Category + QuickFilter + Search + Sort)
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Lọc theo Category
    if (activeCategory && activeCategory !== "All") {
      result = result.filter(
        (task) =>
          task.category.toLowerCase() === activeCategory.toLowerCase() ||
          String(task.categoryId) === String(activeCategory)
      );
    }

    // Lọc theo QuickFilter (all, active, completed, today, upcoming, overdue)
    if (activeFilter === "active") {
      result = result.filter((task) => !task.completed && task.status !== "done");
    } else if (activeFilter === "completed") {
      result = result.filter((task) => task.completed || task.status === "done");
    } else if (activeFilter === "today") {
      result = result.filter((task) => task.deadlineTone === "today");
    } else if (activeFilter === "upcoming") {
      result = result.filter((task) => task.deadlineTone === "upcoming");
    } else if (activeFilter === "overdue") {
      result = result.filter(
        (task) => task.deadlineTone === "overdue" && !task.completed
      );
    }

    // Lọc theo Từ khóa Search
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const notesMatch = task.notes ? task.notes.toLowerCase().includes(query) : false;
        const categoryMatch = task.category.toLowerCase().includes(query);
        return titleMatch || notesMatch || categoryMatch;
      });
    }

    // Sắp xếp (Sort)
    const priorityRank: Record<TaskPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    if (sortBy === "priority") {
      result.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "oldest") {
      result.reverse();
    }

    return result;
  }, [tasks, activeCategory, activeFilter, searchQuery, sortBy]);

  // Số liệu thống kê động
  const stats = useMemo<TaskBoardStats>(() => {
    const completed = tasks.filter((task) => task.completed || task.status === "done").length;
    const overdue = tasks.filter(
      (task) => task.deadlineTone === "overdue" && !task.completed
    ).length;

    return {
      total: tasks.length,
      active: tasks.length - completed,
      completed,
      overdue,
      completionRate:
        tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const openAddTask = useCallback(() => {
    setIsAddTaskOpen(true);
  }, []);

  const closeAddTask = useCallback(() => {
    setIsAddTaskOpen(false);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const closeEditTask = useCallback(() => {
    setEditingTask(null);
  }, []);

  // Thêm category
  const addCategory = useCallback(
    async (name: string, color?: string): Promise<Category | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
        return null;
      }

      const assignedColor =
        color || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];

      let categoryId = String(Date.now());

      try {
        const res = await createCategoryApi({
          name: trimmed,
          color: assignedColor,
          icon: null,
        });
        const createdId = res?.data?.id ?? res?.id;
        if (createdId) {
          categoryId = String(createdId);
        }
      } catch (err) {
        console.warn("API create category fallback:", err);
      }

      const newCat: Category = {
        id: categoryId,
        name: trimmed,
        color: assignedColor,
        count: 0,
      };

      setCategories((prev) => [...prev, newCat]);
      showToast(`Category "${trimmed}" đã được thêm.`);
      return newCat;
    },
    [categories, showToast]
  );

  // Xóa category
  const removeCategory = useCallback(
    async (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setActiveCategory((prev) => (prev === id ? "All" : prev));
      try {
        await deleteCategoryApi(id);
        showToast("Đã xóa danh mục.");
      } catch (err) {
        console.warn("Failed to delete category on backend:", err);
      }
    },
    [showToast]
  );

  // Thêm Task mới
  const addTask = useCallback(
    async (newTaskData: AddTaskData) => {
      const trimmedCategory = newTaskData.category?.trim() || "General";
      const matchedCat = categories.find(
        (c) =>
          c.id === newTaskData.categoryId ||
          c.name.toLowerCase() === trimmedCategory.toLowerCase()
      );

      const finalColor =
        newTaskData.categoryColor ||
        matchedCat?.color ||
        CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];

      const finalCategoryId = newTaskData.categoryId || matchedCat?.id || null;

      const newTask: Task = {
        id: newTaskData.id || `task-${Date.now()}`,
        categoryId: finalCategoryId,
        title: newTaskData.title,
        notes: newTaskData.notes,
        category: matchedCat?.name || trimmedCategory,
        categoryColor: finalColor || "#475569",
        priority: newTaskData.priority,
        status: "todo",
        deadline: formatDeadline(newTaskData.deadline),
        deadlineTone: getDeadlineTone(newTaskData.deadline),
        hasNotes: Boolean(newTaskData.notes),
        completed: false,
      };

      setTasks((prev) => [newTask, ...prev]);
      showToast(`Đã thêm task "${newTask.title}"!`);
    },
    [categories, showToast]
  );

  // Cập nhật Task
  const updateTask = useCallback(
    async (
      id: string,
      data: {
        title?: string;
        notes?: string;
        priority?: TaskPriority;
        status?: TaskStatus;
        categoryId?: string | null;
        deadline?: string | null;
      }
    ) => {
      // 1. Cập nhật lạc quan (Optimistic update)
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const matchedCat = categories.find(
            (c) => String(c.id) === String(data.categoryId)
          );
          const newStatus = data.status || t.status;
          const isDone = newStatus === "done";

          return {
            ...t,
            title: data.title ?? t.title,
            notes: data.notes !== undefined ? data.notes : t.notes,
            priority: data.priority ?? t.priority,
            status: newStatus,
            completed: isDone,
            categoryId:
              data.categoryId !== undefined ? data.categoryId : t.categoryId,
            category: matchedCat ? matchedCat.name : t.category,
            categoryColor: matchedCat ? (matchedCat.color || t.categoryColor) : t.categoryColor,
            deadline:
              data.deadline !== undefined
                ? formatDeadline(data.deadline || undefined)
                : t.deadline,
            deadlineTone:
              data.deadline !== undefined
                ? getDeadlineTone(data.deadline || undefined)
                : t.deadlineTone,
            hasNotes: Boolean(data.notes !== undefined ? data.notes : t.notes),
          };
        })
      );

      showToast("Đã cập nhật công việc!");

      // 2. Gửi request PATCH lên backend
      try {
        await updateTaskApi(id, {
          title: data.title,
          notes: data.notes,
          priority: data.priority,
          status: data.status,
          categoryId: data.categoryId,
          deadline: data.deadline,
        });
      } catch (err) {
        console.warn("Could not patch task on backend:", err);
      }
    },
    [categories, showToast]
  );

  // Chuyển đổi trạng thái Done / Todo
  const toggleTaskStatus = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      const nextStatus: TaskStatus = target.completed || target.status === "done" ? "todo" : "done";
      await updateTask(id, { status: nextStatus });
    },
    [tasks, updateTask]
  );

  // Chuyển nhanh giữa 4 cột trạng thái
  const changeTaskStatus = useCallback(
    async (id: string, newStatus: TaskStatus) => {
      await updateTask(id, { status: newStatus });
    },
    [updateTask]
  );

  // Xóa Task
  const deleteTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      const title = target?.title || "Task";

      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast(`Đã xóa task "${title}".`);

      try {
        await deleteTaskApi(id);
      } catch (err) {
        console.warn("Could not delete task on backend:", err);
      }
    },
    [tasks, showToast]
  );

  // Xóa tất cả task đã hoàn thành (Clear completed)
  const clearCompleted = useCallback(async () => {
    const completedTasks = tasks.filter((t) => t.completed || t.status === "done");
    if (completedTasks.length === 0) {
      showToast("Không có task hoàn thành nào để xóa.");
      return;
    }

    setTasks((prev) => prev.filter((t) => !t.completed && t.status !== "done"));
    showToast(`Đã xóa ${completedTasks.length} task đã hoàn thành.`);

    for (const t of completedTasks) {
      try {
        await deleteTaskApi(t.id);
      } catch (err) {
        console.warn(`Failed to delete completed task ${t.id}:`, err);
      }
    }
  }, [tasks, showToast]);

  const value = useMemo<TaskBoardContextValue>(
    () => ({
      tasks,
      filteredTasks,
      categories: categoriesWithCounts,
      activeCategory,
      setActiveCategory,
      activeFilter,
      setActiveFilter,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      addCategory,
      removeCategory,
      addTask,
      updateTask,
      toggleTaskStatus,
      changeTaskStatus,
      deleteTask,
      clearCompleted,
      editingTask,
      openEditTask,
      closeEditTask,
      isLoadingTasks,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
      refreshTasks,
    }),
    [
      tasks,
      filteredTasks,
      categoriesWithCounts,
      activeCategory,
      activeFilter,
      searchQuery,
      sortBy,
      addCategory,
      removeCategory,
      addTask,
      updateTask,
      toggleTaskStatus,
      changeTaskStatus,
      deleteTask,
      clearCompleted,
      editingTask,
      openEditTask,
      closeEditTask,
      isLoadingTasks,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
      refreshTasks,
    ]
  );

  return (
    <TaskBoardContext.Provider value={value}>
      {children}
      <AddTask
        isOpen={isAddTaskOpen}
        onClose={closeAddTask}
        onAddTask={addTask}
        categories={categoriesWithCounts}
      />
      <EditTaskModal
        isOpen={Boolean(editingTask)}
        task={editingTask}
        categories={categoriesWithCounts}
        onClose={closeEditTask}
        onSave={updateTask}
      />
    </TaskBoardContext.Provider>
  );
}

export function useTaskBoard() {
  const context = useContext(TaskBoardContext);

  if (!context) {
    throw new Error("useTaskBoard must be used within TaskBoardProvider");
  }

  return context;
}
