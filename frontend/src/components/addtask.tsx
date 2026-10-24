"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { createTaskApi } from "@/api/API_createTask";
import { createCategoryApi } from "@/api/API_Category";
import { clearAuthSession } from "@/lib/auth";

interface AddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (taskData: {
    id?: string;
    categoryId?: string;
    categoryColor?: string;
    title: string;
    priority: "low" | "medium" | "high";
    category: string;
    deadline?: string;
    notes?: string;
  }) => void;
  categories?: Array<{ id?: string; name: string; color?: string }>;
}

export default function AddTask({
  isOpen,
  onClose,
  onAddTask,
  categories = [],
}: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id || "");
    }
  }, [categories, categoryId]);

  const resetForm = useCallback(() => {
    setTitle("");
    setPriority("Medium");
    setCategoryId(categories[0]?.id || "");
    setDeadline("");
    setNotes("");
    setError(null);
    setIsLoading(false);
  }, [categories]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Close when pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isOpen, isLoading]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Tiêu đề không được để trống.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const selectedCat =
        categories.find((c) => c.id === categoryId || c.name === categoryId) ||
        categories[0];
      const resolvedCategoryId = selectedCat?.id || null;

      // Định dạng deadline thành ISO string (e.g. 2026-10-02T02:57:25.850Z)
      const formattedDeadline = deadline
        ? new Date(deadline).toISOString()
        : null;

      const response = await createTaskApi({
        title: trimmedTitle,
        priority: priority.toLowerCase() as "low" | "medium" | "high",
        status: "todo",
        category_id: resolvedCategoryId,
        deadline: formattedDeadline,
        notes: notes.trim() || null,
      });

      if (onAddTask) {
        onAddTask({
          id: response?.data?.id,
          categoryId: resolvedCategoryId || undefined,
          categoryColor: selectedCat?.color,
          title: trimmedTitle,
          priority: priority.toLowerCase() as "low" | "medium" | "high",
          category: selectedCat?.name || "General",
          deadline: deadline || undefined,
          notes: notes.trim() || undefined,
        });
      }

      handleClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          clearAuthSession();
          setError(
            "Phiên đăng nhập đã hết hạn (Token expired). Đang chuyển hướng về trang đăng nhập..."
          );
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }

        const errorData = err.response?.data;
        const msg =
          errorData?.error?.message ||
          errorData?.detail ||
          errorData?.message ||
          "Không thể tạo task. Vui lòng thử lại.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } else {
        setError("Đã xảy ra lỗi khi tạo task. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 p-2 text-blue-600">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Add task
              </span>
              <h2
                id="add-task-modal-title"
                className="mt-0.5 text-base font-bold text-slate-950"
              >
                Task details
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Title <span className="text-rose-500">*</span>
            </span>
            <input
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
              placeholder="Task title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Priority
              </span>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "High" | "Medium" | "Low")
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
              </span>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.id || cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Deadline
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Notes
            </span>
            <textarea
              className="min-h-24 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Task notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700 flex items-start gap-2">
              <svg className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[110px]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>Add task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
