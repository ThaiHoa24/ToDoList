"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import AddTask from "@/components/addtask";

export type TaskStatus = "todo" | "progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
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

type AddTaskData = {
  title: string;
  priority: TaskPriority;
  category: string;
  deadline?: string;
  notes?: string;
};

type Category = {
  name: string;
  color: string;
  count: number;
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
  categories: Category[];
  stats: TaskBoardStats;
  toastMessage: string | null;
  openAddTask: () => void;
  closeAddTask: () => void;
  dismissToast: () => void;
};

const initialTasks: Task[] = [];

const taskCategories: Category[] = [
  { name: "Work", color: "#0f766e", count: 0 },
  { name: "Study", color: "#2563eb", count: 0 },
  { name: "Personal", color: "#7c3aed", count: 0 },
  { name: "Shopping", color: "#b45309", count: 0 },
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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleAddTask = useCallback((newTaskData: AddTaskData) => {
    const category = taskCategories.find(
      (item) => item.name === newTaskData.category,
    );
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskData.title,
      notes: newTaskData.notes,
      category: newTaskData.category,
      categoryColor: category?.color || "#475569",
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
  }, []);

  const value = useMemo<TaskBoardContextValue>(
    () => ({
      tasks,
      categories: taskCategories,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
    }),
    [
      tasks,
      stats,
      toastMessage,
      openAddTask,
      closeAddTask,
      dismissToast,
    ],
  );

  return (
    <TaskBoardContext.Provider value={value}>
      {children}
      <AddTask
        isOpen={isAddTaskOpen}
        onClose={closeAddTask}
        onAddTask={handleAddTask}
        categories={taskCategories}
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
