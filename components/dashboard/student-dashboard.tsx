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
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

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
    literate: "bg-green-100 text-green-800",
    "semi-literate": "bg-yellow-100 text-yellow-800",
    illiterate: "bg-red-100 text-red-800",
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

  const totalModules =
    dashboardData.stats.modulesInProgress +
    dashboardData.stats.modulesCompleted;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          Welcome back, {dashboardData.user.name}!
        </h1>
        <p className="text-neutral-600 mt-2">
          Track your digital skills progress and continue learning
        </p>
      </div>

      {/* Skill Level Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Skill Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`inline-block px-4 py-2 rounded-lg font-semibold capitalize ${
                skillLevelColor[
                  dashboardData.user.digitalLiteracyLevel.toLowerCase()
                ]
              }`}
            >
              {dashboardData.user.digitalLiteracyLevel}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {dashboardData.stats.averageScore}%
              </div>
              <Progress
                value={dashboardData.stats.averageScore}
                className="h-2"
              />
              <p className="text-sm text-neutral-600">
                {dashboardData.stats.assessmentsCompleted} assessment
                {dashboardData.stats.assessmentsCompleted !== 1 ? "s" : ""}{" "}
                completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Learning Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.modulesCompleted}/{totalModules}
            </div>
            <p className="text-sm text-neutral-600">Completed</p>
            {dashboardData.stats.modulesInProgress > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {dashboardData.stats.modulesInProgress} in progress
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Start Assessment</CardTitle>
            <CardDescription>
              Take a digital skills assessment test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/assessment">
              <Button>Begin Assessment</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>
              Access learning modules based on your level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/learning-modules">
              <Button>View Modules</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress */}
      {dashboardData.moduleProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Learning Progress</CardTitle>
            <CardDescription>Continue where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.moduleProgress.slice(0, 5).map((module) => (
                <div key={module._id} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-neutral-900">
                      {module.moduleId.title}
                    </p>
                    <span className="text-sm text-neutral-600">
                      {module.completionPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={module.completionPercentage}
                    className="h-2"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Last accessed {formatDate(module.lastAccessedAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {dashboardData.recentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Your latest test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentResults.map((result, idx) => (
                <div
                  key={result._id}
                  className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      Assessment #{dashboardData.recentResults.length - idx}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {formatDate(result.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        result.percentage >= 70
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {result.percentage}%
                    </p>
                    <p className="text-xs text-neutral-600">
                      {result.percentage >= 70 ? "Passed" : "Needs Improvement"}
                    </p>
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
