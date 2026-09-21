"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (taskData: {
    title: string;
    priority: "low" | "medium" | "high";
    category: string;
    deadline?: string;
    notes?: string;
  }) => void;
  categories?: Array<{ name: string; color?: string }>;
}

export default function AddTask({
  isOpen,
  onClose,
  onAddTask,
  categories = [
    { name: "Work" },
    { name: "Study" },
    { name: "Personal" },
    { name: "Shopping" },
  ],
}: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [category, setCategory] = useState(categories[0]?.name || "Work");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setPriority("Medium");
    setCategory(categories[0]?.name || "Work");
    setDeadline("");
    setNotes("");
    setError(null);
  }, [categories]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Close when pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required after trim.");
      return;
    }

    if (onAddTask) {
      onAddTask({
        title: trimmedTitle,
        priority: priority.toLowerCase() as "low" | "medium" | "high",
        category,
        deadline: deadline || undefined,
        notes: notes.trim() || undefined,
      });
    }

    handleClose();
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
            {error && (
              <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>
            )}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
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

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer shadow-sm"
              type="submit"
            >
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
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
