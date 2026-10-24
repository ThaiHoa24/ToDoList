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
import {
  createCategoryApi,
  getCategoriesApi,
  deleteCategoryApi,
} from "@/api/API_Category";

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
  addCategory: (name: string, color?: string) => Promise<Category | null>;
  removeCategory: (id: string) => void;
  stats: TaskBoardStats;
  toastMessage: string | null;
  openAddTask: () => void;
  closeAddTask: () => void;
  dismissToast: () => void;
};

const initialTasks: Task[] = [];

// Mock categories có sẵn đầy đủ UUID v4 chuẩn để tạo task và hiển thị
const initialCategories: Category[] = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    name: "Work",
    color: "#0f766e",
    count: 0,
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    name: "Study",
    color: "#2563eb",
    count: 0,
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    name: "Personal",
    color: "#7c3aed",
    count: 0,
  },
  {
    id: "d4444444-4444-4444-8444-444444444444",
    name: "Shopping",
    color: "#b45309",
    count: 0,
  },
];

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
  if (deadlineDate.getTime() < now.getTime()) return "overdue";

  const isToday =
    deadlineDate.getFullYear() === now.getFullYear() &&
    deadlineDate.getMonth() === now.getMonth() &&
    deadlineDate.getDate() === now.getDate();

  return isToday ? "today" : "upcoming";
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

export function TaskBoardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const remoteCats = await getCategoriesApi();
        if (Array.isArray(remoteCats) && remoteCats.length > 0) {
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

  const categoriesWithCounts = useMemo<Category[]>(() => {
    return categories.map((cat) => ({
      ...cat,
      count: tasks.filter(
        (t) =>
          (t.categoryId && t.categoryId === cat.id) ||
          t.category.toLowerCase() === cat.name.toLowerCase()
      ).length,
    }));
  }, [categories, tasks]);

  const filteredTasks = useMemo(() => {
    if (!activeCategory || activeCategory === "All") {
      return tasks;
    }
    return tasks.filter(
      (task) =>
        task.category.toLowerCase() === activeCategory.toLowerCase() ||
        task.categoryId === activeCategory
    );
  }, [tasks, activeCategory]);

  const stats = useMemo<TaskBoardStats>(() => {
    const completed = tasks.filter((task) => task.completed).length;

    return {
      total: tasks.length,
      active: tasks.length - completed,
      completed,
      overdue: tasks.filter((task) => task.deadlineTone === "overdue").length,
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

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Thêm category: gọi API POST /api/v1/categories và lưu lại UUID
  const addCategory = useCallback(
    async (name: string, color?: string): Promise<Category | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
        return null;
      }

      const assignedColor =
        color || CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];

      // Tạo fallback UUID v4 hợp lệ phòng khi backend chưa đầy đủ
      let categoryId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "e" + Math.random().toString(36).substring(2, 10) + "-1111-4111-8111-111111111111";

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
        console.warn("API create category fallback to mock UUID:", err);
      }

      const newCat: Category = {
        id: categoryId,
        name: trimmed,
        color: assignedColor,
        count: 0,
      };

      setCategories((prev) => [...prev, newCat]);
      return newCat;
    },
    [categories]
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id && c.name !== id));
    setActiveCategory((prev) => (prev === id ? "All" : prev));
    deleteCategoryApi(id).catch((err) => {
      console.warn("Failed to delete category on backend:", err);
    });
  }, []);

  const handleAddTask = useCallback(
    (newTaskData: AddTaskData) => {
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
      setToastMessage(`Task "${newTask.title}" added to your board!`);
      window.setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    },
    [categories]
  );

  const value = useMemo<TaskBoardContextValue>(
    () => ({
      tasks,
      filteredTasks,
      categories: categoriesWithCounts,
      activeCategory,
      setActiveCategory,
      addCategory,
      removeCategory,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
    }),
    [
      tasks,
      filteredTasks,
      categoriesWithCounts,
      activeCategory,
      addCategory,
      removeCategory,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
    ]
  );

  return (
    <TaskBoardContext.Provider value={value}>
      {children}
      <AddTask
        isOpen={isAddTaskOpen}
        onClose={closeAddTask}
        onAddTask={handleAddTask}
        categories={categoriesWithCounts}
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
