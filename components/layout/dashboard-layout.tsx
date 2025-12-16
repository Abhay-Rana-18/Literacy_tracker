"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoredUser {
  name: string;
  role: string;
  profilePicture?: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user) as StoredUser;
        console.log("user: ", userData);
        setUserName(userData.name);
        setUserRole(userData.role);
        setUserAvatar(userData.profilePicture ?? null);
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const baseNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/assessment", label: "Assessment", icon: "📝" },
    { href: "/results", label: "Results", icon: "📈" },
    { href: "/learning-modules", label: "Learning", icon: "📚" },
  ];

  const navItems =
    userRole === "teacher"
      ? baseNavItems.filter((item) => item.href !== "/results")
      : baseNavItems;

  const handleNavClick = (href: string) => {
    setIsSidebarOpen(false);
    router.push(href);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white border-b border-neutral-200 px-3 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-md hover:bg-neutral-100"
            aria-label="Toggle navigation"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img
                src="/logo2.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-neutral-900 text-sm truncate">
              Skills
            </span>
          </div>
        </div>

        {userName && (
          <div className="flex items-center gap-2">
            {userAvatar && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-neutral-200">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-900 truncate max-w-[100px]">
                {userName}
              </p>
              <p className="text-[10px] text-neutral-500 capitalize">
                {userRole}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-neutral-200 flex flex-col
          transition-all duration-300
          fixed inset-y-0 left-0 z-40 w-64
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
          ${isSidebarOpen ? "md:w-64" : "md:w-20"}
        `}
      >
        {/* Desktop header (inside sidebar) */}
        <div className="hidden md:flex p-4 border-b border-neutral-200 items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/logo2.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {isSidebarOpen && (
              <span className="font-semibold text-neutral-900 whitespace-nowrap">
                Skills
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 mt-12 md:mt-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-neutral-700 hover:bg-blue-50 hover:text-primary"
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 md:p-4 border-t border-neutral-200 space-y-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 text-xs md:text-sm px-3 py-2 bg-neutral-50 rounded-lg">
              {userAvatar && (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-neutral-200">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {userName}
                </p>
                <p className="text-neutral-500 capitalize text-[11px] md:text-xs truncate">
                  {userRole}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="pt-13 md:pt-0 px-5 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
