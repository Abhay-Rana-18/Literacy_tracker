"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name);
      setUserRole(userData.role);
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

  // Hide Results for teachers
  const navItems =
    userRole === "teacher"
      ? baseNavItems.filter((item) => item.href !== "/results")
      : baseNavItems;

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
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
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center my-2 gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-neutral-700 hover:bg-blue-50 hover:text-primary"
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {isSidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 space-y-2">
          {isSidebarOpen && (
            <div className="text-sm px-4 py-2 bg-neutral-50 rounded-lg">
              <p className="font-medium text-neutral-900">{userName}</p>
              <p className="text-neutral-500 capitalize text-xs">{userRole}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
