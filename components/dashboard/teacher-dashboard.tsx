"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface StudentPerformance {
  studentName: string;
  assessmentCount: number;
  averageScore: number;
}

interface ProgressOverview {
  _id: string;
  userId: {
    _id: string;
    name: string;
    digitalLiteracyLevel: string;
  };
  moduleId: {
    _id: string;
    title: string;
  };
  completionPercentage: number;
  lastAccessedAt: string;
}

interface DashboardData {
  stats: {
    totalStudents: number;
    averageClassScore: number;
    assessmentsGiven: number;
  };
  studentPerformance: StudentPerformance[];
  progressOverview: ProgressOverview[];
}

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token) {
        router.push("/login");
        return;
      }

      // Check if user is teacher
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role !== "teacher" && userData.role !== "admin") {
          router.push("/dashboard");
          return;
        }
      }

      const data = await api.get("/dashboard/teacher");
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load dashboard");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const skillLevelColor = {
    literate: "bg-green-100 text-green-800",
    "semi-literate": "bg-yellow-100 text-yellow-800",
    illiterate: "bg-red-100 text-red-800",
  } as Record<string, string>;

  const getStudentsByLevel = (level: string) => {
    if (!dashboardData) return 0;
    return dashboardData.progressOverview.filter(
      (p) => p.userId.digitalLiteracyLevel.toLowerCase() === level.toLowerCase()
    ).length;
  };

  const getUniqueStudents = () => {
    if (!dashboardData) return [];
    const uniqueStudents = new Map();

    dashboardData.progressOverview.forEach((progress) => {
      const studentId = progress.userId._id;
      if (!uniqueStudents.has(studentId)) {
        uniqueStudents.set(studentId, {
          id: studentId,
          name: progress.userId.name,
          level: progress.userId.digitalLiteracyLevel,
          progress: 0,
          moduleCount: 0,
        });
      }
      const student = uniqueStudents.get(studentId);
      student.progress += progress.completionPercentage;
      student.moduleCount += 1;
    });

    // Calculate average progress for each student
    Array.from(uniqueStudents.values()).forEach((student) => {
      if (student.moduleCount > 0) {
        student.progress = Math.round(student.progress / student.moduleCount);
      }
    });

    return Array.from(uniqueStudents.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const students = getUniqueStudents();

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          Teacher Dashboard
        </h1>
        <p className="text-neutral-600 mt-2">
          Manage your students and track their progress
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.totalStudents}
            </div>
            <p className="text-xs text-gray-500 mt-1">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Class Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.averageClassScore || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.stats.assessmentsGiven} assessments given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Literate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getStudentsByLevel("literate")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Advanced level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Need Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getStudentsByLevel("illiterate")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Summary */}
      {dashboardData.studentPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Overview</CardTitle>
            <CardDescription>Assessment results summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.studentPerformance.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {student.studentName}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {student.assessmentCount} assessment
                      {student.assessmentCount !== 1 ? "s" : ""} completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        student.averageScore >= 70
                          ? "text-green-600"
                          : student.averageScore >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {student.averageScore}%
                    </p>
                    <p className="text-xs text-neutral-500">Average</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Progress List */}
      {students.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>
              Monitor your students learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {student.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          skillLevelColor[student.level.toLowerCase()]
                        }`}
                      >
                        {student.level}
                      </div>
                      <div className="flex-1 max-w-xs">
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-neutral-600">
                        {student.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {student.moduleCount} module
                      {student.moduleCount !== 1 ? "s" : ""} in progress
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">
              No student progress data available yet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Module Progress Details */}
      {dashboardData.progressOverview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Module Progress Details</CardTitle>
            <CardDescription>
              Detailed view of student module progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.progressOverview.map((progress) => (
                <div
                  key={progress._id}
                  className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {progress.userId.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {progress.moduleId.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={progress.completionPercentage}
                      className="h-2 w-24"
                    />
                    <span className="text-sm font-medium text-neutral-600 w-12 text-right">
                      {progress.completionPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
