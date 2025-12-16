"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import TeacherDashboard from "@/components/dashboard/teacher-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

type UserRole = "student" | "teacher" | "admin";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    } catch (error) {
      console.error("Failed to parse user:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <DashboardLayout>
      {userRole === "student" && <StudentDashboard />}
      {userRole === "teacher" && <TeacherDashboard />}
      {userRole === "admin" && <AdminDashboard />}
    </DashboardLayout>
  );
}
