"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Award,
  TrendingUp,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Clock,
} from "lucide-react";

interface DashboardData {
  user: {
    name: string;
    email: string;
    digitalLiteracyLevel: string;
  };
  stats: {
    assessmentsCompleted: number;
    averageScore: number;
    modulesInProgress: number;
    modulesCompleted: number;
  };
  recentResults: Array<{
    _id: string;
    percentage: number;
    createdAt: string;
  }>;
  moduleProgress: Array<{
    _id: string;
    moduleId: {
      _id: string;
      title: string;
    };
    completionPercentage: number;
    lastAccessedAt: string;
  }>;
}

export default function StudentDashboard() {
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
      if (!token) {
        router.push("/login");
        return;
      }

      const data = await api.get("/dashboard/student");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 30)} month${
      Math.floor(diffDays / 30) > 1 ? "s" : ""
    } ago`;
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

  const totalModules =
    dashboardData.stats.modulesInProgress +
    dashboardData.stats.modulesCompleted;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className=" rounded-lg sm:rounded-xl sm:p-8 text-black">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Welcome back, {dashboardData.user.name}!
          </h1>
          <p className="text-gray-600 text-xs sm:text-base">
            Track your digital skills progress and continue learning
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Skill Level */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-700">
                  Your Skill Level
                </CardTitle>
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold capitalize border ${
                  skillLevelColor[
                    dashboardData.user.digitalLiteracyLevel.toLowerCase()
                  ]
                }`}
              >
                {dashboardData.user.digitalLiteracyLevel}
              </div>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="bg-green-50/50 border-green-100">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-700">
                  Average Score
                </CardTitle>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {dashboardData.stats.averageScore}%
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-500"
                    style={{ width: `${dashboardData.stats.averageScore}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {dashboardData.stats.averageScore}%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                {dashboardData.stats.assessmentsCompleted} test
                {dashboardData.stats.assessmentsCompleted !== 1 ? "s" : ""}{" "}
                completed
              </p>
            </CardContent>
          </Card>

          {/* Modules */}
          <Card className="bg-blue-50/50 border-blue-100 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-700">
                  Learning Modules
                </CardTitle>
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {dashboardData.stats.modulesCompleted}/{totalModules}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Completed</p>
              {dashboardData.stats.modulesInProgress > 0 && (
                <p className="text-xs sm:text-sm text-blue-600 mt-1 sm:mt-2 flex items-center gap-1">
                  <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {dashboardData.stats.modulesInProgress} in progress
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link href="/assessment" className="block">
            <Card className="h-full border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">
                    Start Assessment
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                  Take a digital skills assessment test
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-800">
                  Begin Assessment
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/learning-modules" className="block">
            <Card className="h-full border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">
                    Continue Learning
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                  Access learning modules based on your level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full sm:w-auto text-sm border-gray-300 hover:bg-gray-50"
                  variant="outline"
                >
                  View Modules
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Module Progress */}
        {dashboardData.moduleProgress.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <CardTitle className="text-base sm:text-lg">
                  Your Learning Progress
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Continue where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {dashboardData.moduleProgress.slice(0, 5).map((module) => (
                  <div
                    key={module._id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {module.moduleId.title}
                      </p>
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        {module.completionPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[150px]">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{
                            width: `${module.completionPercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {module.completionPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last accessed {formatDate(module.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {dashboardData.recentResults.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <CardTitle className="text-base sm:text-lg">
                  Recent Assessments
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Your latest test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentResults.map((result, idx) => (
                  <div
                    key={result._id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        Assessment #{dashboardData.recentResults.length - idx}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(result.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xl sm:text-2xl font-bold ${
                            result.percentage >= 70
                              ? "text-green-600"
                              : result.percentage >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.percentage}%
                        </p>
                        <p className="text-xs text-gray-600">
                          {result.percentage >= 70
                            ? "Passed"
                            : "Needs Improvement"}
                        </p>
                      </div>
                      {result.percentage >= 70 && (
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      )}
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
