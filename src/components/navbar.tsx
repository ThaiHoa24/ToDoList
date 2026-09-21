"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/use-current-user";
import { clearAuthSession } from "@/lib/auth";

export interface Category {
  id: string;
  name: string;
  color?: string;
  count: number;
  isNeutral?: boolean;
  isUncategorized?: boolean;
}

interface NavbarProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  onCreateTask?: () => void;
  className?: string;
}

export default function Navbar({
  activeNav: initialNav = "Dashboard",
  onNavChange,
  activeCategory: initialCat = "All",
  onCategoryChange,
  onCreateTask,
  className = "",
}: NavbarProps) {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState(initialNav);
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [newCatName, setNewCatName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useCurrentUser();

  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "All", count: 0, isNeutral: true },
    { id: "study", name: "Study", color: "#2563eb", count: 0 },
    { id: "work", name: "Work", color: "#0f766e", count: 0 },
    { id: "personal", name: "Personal", color: "#7c3aed", count: 0 },
    { id: "shopping", name: "Shopping", color: "#b45309", count: 0 },
    { id: "uncategorized", name: "Uncategorized", count: 0, isUncategorized: true },
  ]);

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    onNavChange?.(nav);
    setMobileOpen(false);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
    setMobileOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const colors = ["#2563eb", "#0f766e", "#7c3aed", "#b45309", "#db2777", "#ea580c"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCat: Category = {
      id: Date.now().toString(),
      name: trimmed,
      color: randomColor,
      count: 0,
    };

    setCategories((prev) => {
      const uncatIndex = prev.findIndex((c) => c.isUncategorized);
      if (uncatIndex !== -1) {
        const next = [...prev];
        next.splice(uncatIndex, 0, newCat);
        return next;
      }
      return [...prev, newCat];
    });

    setNewCatName("");
  };

  const handleRemoveCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (activeCategory === id) {
      handleCategoryClick("All");
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            T
          </span>
          <strong className="text-slate-800 font-bold text-base">ToDoList</strong>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Aside Element */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out select-none shadow-xl md:shadow-none shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${className}`}
        aria-label="Navigation and filters"
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20"
              aria-hidden="true"
            >
              T
            </span>
            <strong className="text-slate-900 font-bold text-lg tracking-tight">
              ToDoList
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Clusters & Categories (Scrollbar hidden) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Create Task Button */}
          <button
            type="button"
            onClick={() => {
              onCreateTask?.();
              setMobileOpen(false);
            }}
            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer active:scale-95"
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
            Create task
          </button>

          {/* Quick navigation */}
          <nav className="space-y-1" aria-label="Quick navigation">
            <div className="space-y-1">
              {/* Tasks */}
              <button
                type="button"
                onClick={() => handleNavClick("Tasks")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "Tasks"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg
                    aria-hidden="true"
                    className={`w-4 h-4 ${activeNav === "Tasks" ? "text-blue-600" : "text-slate-400"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Tasks</span>
                </span>
                <strong
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeNav === "Tasks" ? "bg-blue-200/70 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  4
                </strong>
              </button>

              {/* Activities */}
              <button
                type="button"
                onClick={() => handleNavClick("Activities")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "Activities"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg
                    aria-hidden="true"
                    className={`w-4 h-4 ${activeNav === "Activities" ? "text-blue-600" : "text-slate-400"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 5 14h6l-1 8 8-12h-6z" />
                  </svg>
                  <span>Activities</span>
                </span>
                <strong
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeNav === "Activities" ? "bg-blue-200/70 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  1
                </strong>
              </button>
            </div>

            {/* Main Label */}
            <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main
            </div>

            {/* Dashboard */}
            <button
              type="button"
              onClick={() => handleNavClick("Dashboard")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeNav === "Dashboard"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  className={`w-4 h-4 ${activeNav === "Dashboard" ? "text-blue-600" : "text-slate-400"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6h-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6v6H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h6v6h-6z" />
                </svg>
                <span>Dashboard</span>
              </span>
              <strong
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeNav === "Dashboard" ? "bg-blue-200/70 text-blue-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                4
              </strong>
            </button>
          </nav>

          {/* Categories Section */}
          <section className="space-y-2 pt-2 border-t border-slate-100">
            <div className="px-3 py-1 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categories
              </h2>
            </div>

            {/* Category List */}
            <div className="space-y-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;

                return (
                  <div
                    key={cat.id}
                    className="group relative flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-100 font-semibold text-slate-900"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {cat.isNeutral ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                      ) : cat.isUncategorized ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{cat.name}</span>
                    </button>

                    <div className="flex items-center pr-2 gap-1">
                      <strong className="text-xs text-slate-400 px-1">{cat.count}</strong>

                      {!cat.isNeutral && !cat.isUncategorized && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCategory(cat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
                          aria-label={`Remove category ${cat.name}`}
                        >
                          <svg
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Form */}
            <form onSubmit={handleAddCategory} className="pt-2 px-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                <label className="sr-only" htmlFor="navbar-new-category">
                  New category
                </label>
                <input
                  id="navbar-new-category"
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Add category"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Add category"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-semibold text-xs flex items-center justify-center shadow-xs shrink-0"
              aria-label="User Avatar"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || "Guest User"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {user?.email || "guest@example.com"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            title="Log out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
