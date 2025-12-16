"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, Check, Play, FileText, ExternalLink } from "lucide-react";

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
  skillLevel: string;
  lessons: Lesson[];
  duration?: number;
}

interface UserProgress {
  _id: string;
  completionPercentage: number;
  lessonsCompleted: string[];
}

// Helper function to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Handle youtube.com/watch?v=VIDEO_ID
    if (
      urlObj.hostname.includes("youtube.com") &&
      urlObj.searchParams.has("v")
    ) {
      const videoId = urlObj.searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Handle youtu.be/VIDEO_ID
    if (urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Handle youtube.com/embed/VIDEO_ID (already embed format)
    if (urlObj.pathname.includes("/embed/")) {
      return url;
    }

    return url;
  } catch (error) {
    return url;
  }
}

export default function ModuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const [module, setModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [moduleId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Get user role from token or user profile
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserRole(user.role || "");

      const moduleData = await api.get(`/learning-modules/${moduleId}`);
      setModule(moduleData);

      try {
        const progressData = await api.get("/learning-modules/progress/me");
        const moduleProgress = progressData.find(
          (p: any) => p.moduleId._id === moduleId
        );
        setProgress(moduleProgress || null);

        // Find first incomplete lesson
        if (moduleProgress && moduleData.lessons.length > 0) {
          const firstIncomplete = moduleData.lessons.findIndex(
            (lesson: Lesson) =>
              !moduleProgress.lessonsCompleted.includes(lesson.id)
          );
          setSelectedLesson(firstIncomplete !== -1 ? firstIncomplete : 0);
        }
      } catch (err) {
        // Progress might not exist yet
        setProgress(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load module");
      if (err.response?.status === 404) {
        router.push("/learning-modules");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!module || userRole === "teacher") return;

    setCompleting(true);
    try {
      const lessonId = module.lessons[selectedLesson].id;
      const response = await api.post("/learning-modules/complete-lesson", {
        moduleId: module._id,
        lessonId,
      });

      setProgress(response);

      // Move to next lesson if available
      if (selectedLesson < module.lessons.length - 1) {
        setSelectedLesson(selectedLesson + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete lesson");
    } finally {
      setCompleting(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.lessonsCompleted.includes(lessonId) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || "Module not found"}</p>
            <Button onClick={() => router.push("/learning-modules")}>
              Back to Modules
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLesson = module.lessons[selectedLesson];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/learning-modules")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Button>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{module.title}</CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                {module.skillLevel}
              </span>
              <span className="text-sm text-gray-600">
                {module.lessons.length} lessons
              </span>
              {module.duration && (
                <span className="text-sm text-gray-600">
                  {module.duration} minutes
                </span>
              )}
            </div>

            {progress && userRole !== "teacher" && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Your Progress</span>
                  <span className="font-semibold">
                    {progress.completionPercentage}%
                  </span>
                </div>
                <Progress
                  value={progress.completionPercentage}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lesson List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(index)}
                  className={`w-full text-left p-3 rounded-lg transition flex items-center gap-3 ${
                    selectedLesson === index
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      userRole !== "teacher" && isLessonCompleted(lesson.id)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {userRole !== "teacher" && isLessonCompleted(lesson.id) ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-white">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{lesson.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Lesson Content */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{currentLesson.title}</CardTitle>
              {userRole !== "teacher" && isLessonCompleted(currentLesson.id) && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Completed
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video */}
              {currentLesson.videoUrl && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Video Lesson</h3>
                  </div>
                  {currentLesson.videoUrl.includes("youtube.com") ||
                  currentLesson.videoUrl.includes("youtu.be") ? (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <iframe
                        src={getYouTubeEmbedUrl(currentLesson.videoUrl)}
                        title={currentLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <a
                        href={currentLesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Video
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Lesson Content</h3>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {currentLesson.content}
                  </p>
                </div>
              </div>

              {/* Resource */}
              {currentLesson.resourceUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Resources</h3>
                  <a
                    href={currentLesson.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Download Resource
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                {userRole !== "teacher" && !isLessonCompleted(currentLesson.id) && (
                  <Button
                    onClick={handleCompleteLesson}
                    disabled={completing}
                    className="flex-1"
                  >
                    {completing ? "Completing..." : "Mark as Complete"}
                  </Button>
                )}
                {selectedLesson < module.lessons.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLesson(selectedLesson + 1)}
                    className="flex-1"
                  >
                    Next Lesson
                  </Button>
                )}
                {selectedLesson === module.lessons.length - 1 &&
                  (userRole === "teacher" || progress?.completionPercentage === 100) && (
                    <Button
                      onClick={() => router.push("/learning-modules")}
                      className="flex-1"
                    >
                      Back to Modules
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
