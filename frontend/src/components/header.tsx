"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/components/use-current-user";

interface HeaderProps {
  userName?: string;
  searchValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function Header({
  userName: initialUserName,
  searchValue,
  onSearch,
  className = "",
}: HeaderProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [hasNotification, setHasNotification] = useState(true);
  const currentUser = useCurrentUser();
  const userName = initialUserName || currentUser?.name || "Guest";

  const currentSearch = searchValue !== undefined ? searchValue : internalQuery;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (searchValue === undefined) {
      setInternalQuery(val);
    }
    onSearch?.(val);
  };

  const handleClearSearch = () => {
    if (searchValue === undefined) {
      setInternalQuery("");
    }
    onSearch?.("");
  };

  return (
    <header
      className={`w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6 shadow-xs sticky top-0 z-20 shrink-0 select-none ${className}`}
    >
      {/* Left: Welcome Copy */}
      <div className="flex items-center gap-1.5 text-slate-800 shrink-0">
        <span className="text-xs sm:text-sm font-normal text-slate-500">
          Welcome,
        </span>
        <strong className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
          {userName}
        </strong>
      </div>

      {/* Center: Search Field */}
      <div className="flex-1 max-w-md w-full">
        <label
          htmlFor="header-search-input"
          className="flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-100/80 focus-within:bg-white border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl transition-all w-full cursor-text"
        >
          <span className="sr-only">Search tasks</span>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 4 4" />
          </svg>
          <input
            id="header-search-input"
            type="search"
            value={currentSearch}
            onChange={handleSearchChange}
            placeholder="Search title or notes"
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </label>
      </div>

      {/* Right: Actions (Help & Notifications) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Help Button */}
        <button
          type="button"
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Help"
          title="Help"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 2-2.4 2-2.4 4" />
            <path d="M12 17h.01" />
          </svg>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={() => setHasNotification(false)}
          className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
