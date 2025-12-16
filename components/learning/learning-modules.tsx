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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { Plus, MoreVertical, Edit, Trash2, BarChart3 } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  resourceUrl?: string;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  skillLevel: "basic" | "intermediate" | "advanced";
  lessons: Lesson[];
  duration?: number;
  order?: number;
}

interface UserProgress {
  _id: string;
  moduleId: {
    _id: string;
    title: string;
  };
  completionPercentage: number;
  lessonsCompleted: string[];
  completedAt?: string;
  lastAccessedAt: string;
}

interface Statistics {
  module: {
    id: string;
    title: string;
    totalLessons: number;
  };
  statistics: {
    totalStudents: number;
    completedStudents: number;
    inProgress: number;
    averageCompletion: number;
  };
  studentProgress: Array<{
    studentName: string;
    studentEmail: string;
    completionPercentage: number;
    lessonsCompleted: number;
    lastAccessed: string;
  }>;
}

export default function LearningModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<
    "All" | "basic" | "intermediate" | "advanced"
  >("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const modulesData = await api.get("/learning-modules");
      setModules(modulesData);

      if (userRole !== "teacher" && userRole !== "admin") {
        const progressData = await api.get("/learning-modules/progress/me");
        setUserProgress(progressData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load modules");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (moduleId: string) => {
    setLoadingStats(true);
    try {
      const data = await api.get(`/learning-modules/${moduleId}/statistics`);
      setStatistics(data);
      setShowStats(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;

    try {
      await api.delete(`/learning-modules/${moduleToDelete}`);
      setModules(modules.filter((m) => m._id !== moduleToDelete));
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete module");
      setDeleteDialogOpen(false);
    }
  };

  const getModuleProgress = (moduleId: string) => {
    const progress = userProgress.find((p) => p.moduleId._id === moduleId);
    return progress?.completionPercentage || 0;
  };

  const isModuleCompleted = (moduleId: string) => {
    const progress = userProgress.find((p) => p.moduleId._id === moduleId);
    return progress?.completionPercentage === 100;
  };

  const filteredModules =
    selectedLevel === "All"
      ? modules
      : modules.filter((m) => m.skillLevel === selectedLevel);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "basic":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  // Statistics View
  if (showStats && statistics) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="outline"
          onClick={() => setShowStats(false)}
          className="mb-4"
        >
          ← Back to Modules
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{statistics.module.title} - Statistics</CardTitle>
            <CardDescription>
              {statistics.module.totalLessons} lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {statistics.statistics.totalStudents}
                  </div>
                  <p className="text-sm text-gray-600">Total Students</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.statistics.completedStudents}
                  </div>
                  <p className="text-sm text-gray-600">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.statistics.inProgress}
                  </div>
                  <p className="text-sm text-gray-600">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {statistics.statistics.averageCompletion}%
                  </div>
                  <p className="text-sm text-gray-600">Avg Completion</p>
                </CardContent>
              </Card>
            </div>

            {statistics.studentProgress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.studentProgress.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-gray-600">
                            {student.studentEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {student.completionPercentage}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.lessonsCompleted} lessons
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Learning Modules
          </h1>
          <p className="text-neutral-600 mt-2">
            {userRole === "teacher" || userRole === "admin"
              ? "Manage learning modules and track student progress"
              : "Personalized learning paths based on your skill level"}
          </p>
        </div>
        {(userRole === "teacher" || userRole === "admin") && (
          <Button onClick={() => router.push("/learning-modules/add")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Module
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Level Filter */}
      <div className="flex flex-wrap gap-2">
        {(["All", "basic", "intermediate", "advanced"] as const).map(
          (level) => (
            <Button
              key={level}
              onClick={() => setSelectedLevel(level)}
              variant={selectedLevel === level ? "default" : "outline"}
              className="capitalize"
            >
              {level}
            </Button>
          )
        )}
      </div>

      {/* Modules Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredModules.map((module) => (
          <Card
            key={module._id}
            className="hover:shadow-md transition-shadow flex flex-col"
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg flex-1">{module.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getLevelColor(
                      module.skillLevel
                    )}`}
                  >
                    {module.skillLevel}
                  </span>
                  {(userRole === "teacher" || userRole === "admin") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => fetchStatistics(module._id)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Statistics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/learning-modules/edit/${module._id}`)
                          }
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setModuleToDelete(module._id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {userRole !== "teacher" && userRole !== "admin" && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Progress</span>
                    <span className="font-semibold">
                      {getModuleProgress(module._id)}%
                    </span>
                  </div>
                  <Progress
                    value={getModuleProgress(module._id)}
                    className="h-2"
                  />
                </div>
              )}

              <div className="text-sm text-neutral-600">
                {module.lessons.length} lessons
                {module.duration && ` • ${module.duration} min`}
                {userRole !== "teacher" &&
                  userRole !== "admin" &&
                  (isModuleCompleted(module._id)
                    ? " • ✓ Completed"
                    : " • In Progress")}
              </div>

              <Button
                className="w-full"
                onClick={() => router.push(`/learning-modules/${module._id}`)}
              >
                {userRole === "teacher" || userRole === "admin"
                  ? "View Module"
                  : isModuleCompleted(module._id)
                  ? "Review"
                  : "Continue"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No modules found for this level</p>
          </CardContent>
        </Card>
      )}

      {/* Learning Tips */}
      {userRole !== "teacher" && userRole !== "admin" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Learning Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-800">
            <p>• Complete modules in order for better understanding</p>
            <p>• Practice regularly to improve retention</p>
            <p>• Don't hesitate to revisit earlier modules</p>
            <p>• Take notes while learning</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              learning module.
              <span className="block mt-2 font-semibold">
                Note: If students are using this module, deletion will be
                prevented.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
