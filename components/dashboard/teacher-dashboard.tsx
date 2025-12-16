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
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  BookOpen,
  Clock,
} from "lucide-react";

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
    literate: "bg-green-50 text-green-700 border-green-200",
    "semi-literate": "bg-yellow-50 text-yellow-700 border-yellow-200",
    illiterate: "bg-red-50 text-red-700 border-red-200",
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

    Array.from(uniqueStudents.values()).forEach((student) => {
      if (student.moduleCount > 0) {
        student.progress = Math.round(student.progress / student.moduleCount);
      }
    });

    return Array.from(uniqueStudents.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-3">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-3">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const students = getUniqueStudents();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="rounded-lg sm:rounded-xl text-black">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600 text-xs sm:text-base">
            Manage your students and track their progress
          </p>
        </div>

        {/* Overview Stats - Mobile Compact */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Total Students */}
          <Card className="border-gray-200">
            <CardHeader className="pb-0 pt-2 px-3 sm:pb-2 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
                  Total
                  <br className="sm:hidden" /> Students
                </CardTitle>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-1 sm:px-6 sm:pb-6 sm:pt-2">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-0">
                {dashboardData.stats.totalStudents}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Enrolled students
              </p>
            </CardContent>
          </Card>

          {/* Class Average */}
          <Card className="bg-green-50/50 border-green-100">
            <CardHeader className="pb-0 pt-2 px-3 sm:pb-2 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
                  Class
                  <br className="sm:hidden" /> Average
                </CardTitle>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-1 sm:px-6 sm:pb-6 sm:pt-2">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-0">
                {dashboardData.stats.averageClassScore || 0}%
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {dashboardData.stats.assessmentsGiven} tests
              </p>
            </CardContent>
          </Card>

          {/* Literate */}
          <Card className="border-gray-200">
            <CardHeader className="pb-0 pt-2 px-3 sm:pb-2 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
                  Literate
                </CardTitle>
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-1 sm:px-6 sm:pb-6 sm:pt-2">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-0">
                {getStudentsByLevel("literate")}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Advanced level
              </p>
            </CardContent>
          </Card>

          {/* Need Support */}
          <Card className="border-gray-200">
            <CardHeader className="pb-0 pt-2 px-3 sm:pb-2 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
                  Need
                  <br className="sm:hidden" /> Support
                </CardTitle>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-1 sm:px-6 sm:pb-6 sm:pt-2">
              <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-0">
                {getStudentsByLevel("illiterate")}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Performance Summary */}
        {dashboardData.studentPerformance.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <CardTitle className="text-base sm:text-lg">
                  Student Performance Overview
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Assessment results summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.studentPerformance.map((student, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {student.studentName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {student.assessmentCount} assessment
                        {student.assessmentCount !== 1 ? "s" : ""} completed
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-xl sm:text-2xl font-bold ${
                          student.averageScore >= 70
                            ? "text-green-600"
                            : student.averageScore >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {student.averageScore}%
                      </p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Progress List */}
        {students.length > 0 ? (
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <CardTitle className="text-base sm:text-lg">
                  Student Progress
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Monitor your students learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {student.name}
                      </p>
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        {student.progress}%
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                          skillLevelColor[student.level.toLowerCase()]
                        }`}
                      >
                        {student.level}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[150px]">
                          <div
                            className="h-full bg-gray-900 rounded-full transition-all duration-500"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {student.progress}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {student.moduleCount} module
                      {student.moduleCount !== 1 ? "s" : ""} in progress
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200">
            <CardContent className="py-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No student progress data available yet
              </p>
            </CardContent>
          </Card>
        )}

        {/* Module Progress Details */}
        {dashboardData.progressOverview.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <CardTitle className="text-base sm:text-lg">
                  Module Progress Details
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Detailed view of student module progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.progressOverview.map((progress) => (
                  <div
                    key={progress._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {progress.userId.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {progress.moduleId.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-20 sm:w-24">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.completionPercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-10 text-right">
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
    </div>
  );
}
