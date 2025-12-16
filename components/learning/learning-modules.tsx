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
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
      case "intermediate":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
      case "advanced":
        return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 px-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-neutral-700 mx-auto" />
          <p className="mt-4 text-neutral-500 text-sm sm:text-base">
            Loading modules...
          </p>
        </div>
      </div>
    );
  }

  // Statistics View
  if (showStats && statistics) {
    return (
      <div className="min-h-screen bg-neutral-50 px-2 py-4 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowStats(false)}
            className="text-sm border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            size="sm"
          >
            ← Back to modules
          </Button>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100">
              <CardTitle className="text-lg sm:text-xl text-neutral-900">
                {statistics.module.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-neutral-500">
                {statistics.module.totalLessons} lessons • Cohort overview
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-xs text-neutral-500 mb-1">
                    Total students
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-neutral-900">
                    {statistics.statistics.totalStudents}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-50 bg-emerald-50/60 px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-xs text-emerald-700 mb-1">Completed</p>
                  <p className="text-xl sm:text-2xl font-semibold text-emerald-800">
                    {statistics.statistics.completedStudents}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-50 bg-sky-50/60 px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-xs text-sky-700 mb-1">In progress</p>
                  <p className="text-xl sm:text-2xl font-semibold text-sky-800">
                    {statistics.statistics.inProgress}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-xs text-neutral-500 mb-1">
                    Avg. completion
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-neutral-900">
                    {statistics.statistics.averageCompletion}%
                  </p>
                </div>
              </div>

              {statistics.studentProgress.length > 0 && (
                <div className="rounded-xl border border-neutral-100 bg-white">
                  <CardHeader className="px-4 py-3 sm:px-5 sm:py-4 border-b border-neutral-100">
                    <CardTitle className="text-sm sm:text-base text-neutral-900">
                      Student progress
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-neutral-500">
                      High‑level view of how learners are advancing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-5 py-3 sm:py-4">
                    <div className="space-y-2.5 sm:space-y-3 max-h-[420px] overflow-y-auto">
                      {statistics.studentProgress.map((student, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-neutral-900 truncate">
                              {student.studentName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {student.studentEmail}
                            </p>
                          </div>
                          <div className="flex items-baseline gap-2 sm:gap-3 text-right">
                            <p className="text-sm font-semibold text-sky-700">
                              {student.completionPercentage}%
                            </p>
                            <p className="text-xs text-neutral-500">
                              {student.lessonsCompleted} lessons
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-2 py-4 sm:px-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Top section card: title, description, filters, primary action */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                  Learning modules
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  {userRole === "teacher" || userRole === "admin"
                    ? "Organize content and monitor learner progress."
                    : "Follow curated learning paths matched to your level."}
                </p>
              </div>
              {(userRole === "teacher" || userRole === "admin") && (
                <Button
                  onClick={() => router.push("/learning-modules/add")}
                  size="sm"
                  className="gap-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Create module</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-neutral-500">
                Filter by level
              </p>
              <div className="flex flex-wrap gap-2">
                {(["All", "basic", "intermediate", "advanced"] as const).map(
                  (level) => (
                    <Button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      variant={selectedLevel === level ? "default" : "outline"}
                      className={`capitalize text-xs sm:text-sm rounded-full ${
                        selectedLevel === level
                          ? "bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                      }`}
                      size="sm"
                    >
                      {level}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredModules.map((module) => (
            <Card
              key={module._id}
              className="flex flex-col border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition"
            >
              <CardHeader className="px-4 py-4 sm:px-5 sm:py-5 border-b border-neutral-100">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base font-semibold text-neutral-900 truncate">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-neutral-500 line-clamp-2">
                      {module.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getLevelColor(
                        module.skillLevel
                      )}`}
                    >
                      {module.skillLevel}
                    </span>
                    {(userRole === "teacher" || userRole === "admin") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[180px]"
                        >
                          <DropdownMenuItem
                            onClick={() => fetchStatistics(module._id)}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View statistics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/learning-modules/edit/${module._id}`
                              )
                            }
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit module
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setModuleToDelete(module._id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 focus:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 sm:px-5 py-3 sm:py-4 space-y-3">
                {userRole !== "teacher" && userRole !== "admin" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] sm:text-xs">
                      <span className="text-neutral-500">Progress</span>
                      <span className="font-medium text-neutral-700">
                        {getModuleProgress(module._id)}%
                      </span>
                    </div>
                    <Progress
                      value={getModuleProgress(module._id)}
                      className="h-1.5 bg-neutral-100"
                    />
                  </div>
                )}

                <div className="text-xs sm:text-sm text-neutral-500">
                  {module.lessons.length} lessons
                  {module.duration && ` • ${module.duration} min`}
                  {userRole !== "teacher" &&
                    userRole !== "admin" &&
                    (isModuleCompleted(module._id)
                      ? " • Completed"
                      : " • In progress")}
                </div>

                <Button
                  className="w-full mt-1 text-xs sm:text-sm"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/learning-modules/${module._id}`)}
                >
                  {userRole === "teacher" || userRole === "admin"
                    ? "Open module"
                    : isModuleCompleted(module._id)
                    ? "Review module"
                    : "Continue learning"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <Card className="border-dashed border-neutral-200 bg-white">
            <CardContent className="py-8 text-center px-4">
              <p className="text-neutral-500 text-sm sm:text-base">
                No modules found for this level.
              </p>
              {(userRole === "teacher" || userRole === "admin") && (
                <Button
                  className="mt-3 text-xs sm:text-sm"
                  size="sm"
                  onClick={() => router.push("/learning-modules/add")}
                >
                  Create your first module
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Learning Tips */}
        {userRole !== "teacher" && userRole !== "admin" && (
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-100">
              <CardTitle className="text-sm sm:text-base text-neutral-900">
                Learning tips
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-neutral-500">
                Simple habits that make your learning more effective.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
              <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-700">
                <li>Complete modules in order to build concepts gradually.</li>
                <li>Practice regularly instead of cramming in one session.</li>
                <li>Revisit earlier modules when something feels unclear.</li>
                <li>Keep short notes of key ideas while you learn.</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg mx-2">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete module?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm text-neutral-500">
                This action cannot be undone. If learners are currently
                enrolled, deletion may be blocked to avoid losing their
                progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Delete module
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
