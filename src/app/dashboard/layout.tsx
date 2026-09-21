"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Header from "@/components/header";
import {
  TaskBoardProvider,
  useTaskBoard,
} from "@/components/task-board-context";
import { useCurrentUser } from "@/components/use-current-user";
import { getAuthToken } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <TaskBoardProvider>
      <DashboardShell>{children}</DashboardShell>
    </TaskBoardProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { openAddTask } = useTaskBoard();
  const user = useCurrentUser();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-50 flex">
      {/* Left Sidebar / Navbar component */}
      <Navbar onCreateTask={openAddTask} />

      {/* Main Right Content: Header on top (sticky) + scrollable content below */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-14 md:pt-0 bg-slate-50 min-w-0">
        {/* App Header component */}
        <Header userName={user?.name} />

        {/* Scrollable Dashboard Content Area */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
