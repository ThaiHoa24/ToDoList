"use client";

import React, { useMemo } from "react";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
  type QuickFilter,
  type SortOption,
  useTaskBoard,
} from "@/components/task-board-context";

const columns: Array<{
  id: TaskStatus;
  title: string;
  subtitle: string;
  accent: string;
}> = [
  {
    id: "todo",
    title: "Todo list",
    subtitle: "Ready to start",
    accent: "border-t-slate-300",
  },
  {
    id: "progress",
    title: "In Progress",
    subtitle: "Needs focus",
    accent: "border-t-blue-500",
  },
  {
    id: "review",
    title: "In Review",
    subtitle: "Review & Testing",
    accent: "border-t-amber-500",
  },
  {
    id: "done",
    title: "Done",
    subtitle: "Completed",
    accent: "border-t-emerald-500",
  },
];

const priorityStyles: Record<TaskPriority, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusStyles: Record<TaskStatus, string> = {
  todo: "border-slate-200 bg-slate-50 text-slate-600",
  progress: "border-blue-200 bg-blue-50 text-blue-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  progress: "In Progress",
  review: "In Review",
  done: "Done",
};

const deadlineStyles: Record<Task["deadlineTone"], string> = {
  neutral: "text-slate-500",
  today: "text-blue-700 font-semibold",
  upcoming: "text-slate-600",
  overdue: "text-rose-700 font-semibold",
};

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name:
    | "plus"
    | "filter"
    | "sort"
    | "chevron"
    | "edit"
    | "trash"
    | "clock"
    | "note"
    | "search"
    | "spark"
    | "check"
    | "loader"
    | "undo"
    | "alert";
  className?: string;
}) {
  const paths = {
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),
    sort: (
      <>
        <path d="m3 16 4 4 4-4" />
        <path d="M7 20V4" />
        <path d="m21 8-4-4-4 4" />
        <path d="M17 4v16" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    edit: (
      <>
        <path d="M4 20h4" />
        <path d="M14.5 4.5 19.5 9.5 9 20H4v-5z" />
      </>
    ),
    trash: (
      <>
        <path d="M5 7h14" />
        <path d="M9 7V5h6v2" />
        <path d="M8 7l1 13h6l1-13" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    note: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    spark: (
      <>
        <path d="M13 2 5 14h6l-1 8 8-12h-6z" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    loader: (
      <>
        <path d="M12 3a9 9 0 1 1-9 9" />
        <path d="M12 3v5" />
      </>
    ),
    undo: (
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
      </>
    ),
    alert: (
      <>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="flex min-h-28 flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <strong className={`mt-2 text-2xl font-bold sm:text-3xl ${tone}`}>
        {value}
      </strong>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { toggleTaskStatus, changeTaskStatus, openEditTask, deleteTask } =
    useTaskBoard();

  const isCompleted = task.completed || task.status === "done";

  const nextStatuses: Record<TaskStatus, TaskStatus[]> = {
    todo: ["progress", "done"],
    progress: ["review", "done"],
    review: ["progress", "done"],
    done: ["todo"],
  };

  return (
    <article
      className={`group rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isCompleted
          ? "border-emerald-100 bg-emerald-50/30"
          : task.deadlineTone === "overdue"
            ? "border-rose-200"
            : "border-slate-200"
      }`}
      data-task-id={task.id}
    >
      {/* Top Badges & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700"
            style={{ color: task.categoryColor }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: task.categoryColor }}
            />
            {task.category}
          </span>
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusStyles[task.status]}`}
          >
            {statusLabels[task.status]}
          </span>
        </div>

        {/* Action buttons (Edit & Delete) */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => openEditTask(task)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
            aria-label={`Edit ${task.title}`}
            title="Chỉnh sửa task"
          >
            <Icon name="edit" />
          </button>
          <button
            type="button"
            onClick={() => deleteTask(task.id)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer"
            aria-label={`Delete ${task.title}`}
            title="Xóa task"
          >
            <Icon name="trash" />
          </button>
        </div>
      </div>

      {/* Task Title & Overdue Flag */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3
          className={`text-sm font-bold leading-5 text-slate-900 ${
            isCompleted ? "text-slate-400 line-through" : ""
          }`}
        >
          {task.title}
        </h3>
        {task.deadlineTone === "overdue" && !isCompleted && (
          <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
            Overdue
          </span>
        )}
      </div>

      {/* Notes */}
      {task.notes && (
        <p className="mt-2 text-xs leading-5 text-slate-500 line-clamp-2">
          {task.notes}
        </p>
      )}

      {/* Bottom status checkbox & Quick move */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => toggleTaskStatus(task.id)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            aria-label={isCompleted ? "Mark as active" : "Mark as done"}
          />
          <span className={isCompleted ? "text-emerald-700 font-bold" : ""}>
            {isCompleted ? "Done" : "Mark done"}
          </span>
        </label>

        {/* Quick move buttons */}
        <div className="flex items-center gap-1">
          {nextStatuses[task.status]?.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => changeTaskStatus(task.id, st)}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={`Chuyển sang ${statusLabels[st]}`}
            >
              ➔ {statusLabels[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Meta (Deadline & Notes icon) */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
        <span
          className={`inline-flex items-center gap-1.5 ${deadlineStyles[task.deadlineTone]}`}
        >
          <Icon name="clock" className="h-3.5 w-3.5" />
          {task.deadline}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="note" className="h-3.5 w-3.5" />
          {task.hasNotes ? "Note" : "No note"}
        </span>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const {
    tasks: taskList,
    filteredTasks,
    categories,
    activeCategory,
    setActiveCategory,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    stats: dynamicStats,
    toastMessage,
    openAddTask,
    clearCompleted,
    dismissToast,
    isLoadingTasks,
  } = useTaskBoard();

  // Current Date display dynamically
  const todayInfo = useMemo(() => {
    const now = new Date();
    return {
      monthShort: now.toLocaleDateString("en-US", { month: "short" }),
      dayNumber: now.getDate(),
      fullDate: now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  }, []);

  const quickFilters: Array<{
    key: QuickFilter;
    label: string;
    value: number;
  }> = [
    { key: "all", label: "All", value: dynamicStats.total },
    { key: "active", label: "Active", value: dynamicStats.active },
    { key: "completed", label: "Completed", value: dynamicStats.completed },
    {
      key: "today",
      label: "Today",
      value: taskList.filter((task) => task.deadlineTone === "today").length,
    },
    {
      key: "upcoming",
      label: "Upcoming",
      value: taskList.filter((task) => task.deadlineTone === "upcoming").length,
    },
    { key: "overdue", label: "Overdue", value: dynamicStats.overdue },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all animate-in slide-in-from-bottom-5">
          <Icon name="check" className="h-5 w-5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="ml-2 rounded p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
        aria-label="Dashboard summary"
      >
        <SummaryCard label="Total" value={dynamicStats.total} tone="text-slate-800" />
        <SummaryCard label="Active" value={dynamicStats.active} tone="text-blue-600" />
        <SummaryCard
          label="Completed"
          value={dynamicStats.completed}
          tone="text-emerald-600"
        />
        <SummaryCard label="Overdue" value={dynamicStats.overdue} tone="text-rose-600" />

        <div className="col-span-2 flex min-h-28 flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 md:col-span-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completion rate
            </span>
            <strong className="text-xl font-bold text-slate-800 sm:text-2xl">
              {dynamicStats.completionRate}%
            </strong>
          </div>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${dynamicStats.completionRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Task Board Section */}
      <section
        className="rounded-lg border border-slate-200 bg-white shadow-sm"
        aria-label="Daily task board"
      >
        {/* Board Top Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <strong className="text-base leading-none">
                {todayInfo.monthShort}
              </strong>
              <span className="mt-1 text-xs font-semibold text-slate-300">
                {todayInfo.dayNumber}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Today is
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {todayInfo.fullDate}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter Selector */}
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                aria-label="Filter by category"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                aria-label="Sort tasks"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="priority">Sort: Priority</option>
                <option value="title">Sort: Title (A-Z)</option>
              </select>
            </div>

            <button
              onClick={openAddTask}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              type="button"
            >
              <Icon name="plus" />
              Create task
            </button>
          </div>
        </div>

        {/* Board Body */}
        <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {/* Search and Clear Completed Toolbar */}
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
              <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <span className="sr-only">Search task title or notes</span>
                <Icon name="search" className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Search title, notes, or category..."
                  type="search"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={clearCompleted}
                disabled={dynamicStats.completed === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Clear completed
              </button>
            </div>

            {/* Quick Filter Tabs */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Quick filters"
            >
              {quickFilters.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer ${
                      isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    type="button"
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {filter.value}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Kanban Columns */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Workspace
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    Tasks board
                  </h2>
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {dynamicStats.active} active left
                </span>
              </div>

              <div className="grid gap-3 xl:grid-cols-4">
                {columns.map((column) => {
                  const columnTasks = filteredTasks.filter(
                    (task) => task.status === column.id,
                  );

                  return (
                    <section
                      className={`flex min-h-80 flex-col rounded-lg border border-slate-200 border-t-4 ${column.accent} bg-white p-3`}
                      key={column.id}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {column.title}
                          </h3>
                          <span className="text-xs font-medium text-slate-400">
                            {column.subtitle}
                          </span>
                        </div>
                        <strong className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {columnTasks.length}
                        </strong>
                      </div>

                      <div className="flex flex-1 flex-col gap-3">
                        {isLoadingTasks ? (
                          // Loading Skeletons
                          <div className="space-y-3">
                            <div className="h-28 rounded-lg border border-slate-200 bg-slate-100/60 animate-pulse" />
                            <div className="h-24 rounded-lg border border-slate-200 bg-slate-100/60 animate-pulse" />
                          </div>
                        ) : columnTasks.length ? (
                          columnTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        ) : (
                          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-center text-sm font-medium text-slate-400 min-h-24">
                            No matching tasks
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Aside: Category List & Statistics */}
          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories
                  </span>
                  <h2 className="mt-1 text-base font-bold text-slate-950">
                    Task groups
                  </h2>
                </div>
                <Icon name="spark" className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory("All")}
                  className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                    activeCategory === "All"
                      ? "border-blue-300 bg-blue-50 text-blue-700 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-sm">All Tasks</span>
                  <strong className="text-xs text-slate-500">
                    {dynamicStats.total}
                  </strong>
                </button>
                {categories.length === 0 ? (
                  <p className="py-3 text-center text-xs italic text-slate-400">
                    Chưa có danh mục nào
                  </p>
                ) : (
                  categories.map((category) => {
                    const isSelected = activeCategory === category.name;
                    return (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() => setActiveCategory(category.name)}
                        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "border-blue-300 bg-blue-50 text-blue-700 font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate">{category.name}</span>
                        </span>
                        <strong className="text-xs text-slate-500">
                          {category.count}
                        </strong>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
