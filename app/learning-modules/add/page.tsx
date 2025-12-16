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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Plus, Trash2, ArrowLeft, Check } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  resourceUrl: string;
}

export default function AddLearningModulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [module, setModule] = useState({
    title: "",
    description: "",
    skillLevel: "basic",
    duration: 30,
    order: 1,
  });

  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: "1",
      title: "",
      content: "",
      videoUrl: "",
      resourceUrl: "",
    },
  ]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
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

    setLoading(false);
  };

  const addLesson = () => {
    setLessons([
      ...lessons,
      {
        id: (lessons.length + 1).toString(),
        title: "",
        content: "",
        videoUrl: "",
        resourceUrl: "",
      },
    ]);
  };

  const removeLesson = (index: number) => {
    if (lessons.length > 1) {
      setLessons(lessons.filter((_, i) => i !== index));
    }
  };

  const duplicateLesson = (index: number) => {
    const lessonToDuplicate = { ...lessons[index] };
    lessonToDuplicate.id = (lessons.length + 1).toString();
    setLessons([...lessons, lessonToDuplicate]);
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string) => {
    const updated = [...lessons];
    updated[index][field] = value;
    setLessons(updated);
  };

  const handleSubmit = async () => {
    setCreating(true);
    setError("");
    setSuccess(false);

    try {
      if (!module.title.trim() || !module.description.trim()) {
        throw new Error("Please fill in all required fields");
      }

      const validLessons = lessons.filter((lesson) => {
        return lesson.title.trim() !== "" && lesson.content.trim() !== "";
      });

      if (validLessons.length === 0) {
        throw new Error("Please add at least one complete lesson");
      }

      const moduleData = {
        ...module,
        lessons: validLessons,
      };

      await api.post("/learning-modules", moduleData);
      setSuccess(true);

      setTimeout(() => {
        router.push("/learning-modules");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to create module"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Module Created!
            </h2>
            <p className="text-gray-600">Redirecting to modules...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/learning-modules")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Modules
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Learning Module
          </h1>
          <p className="text-gray-600 mt-2">
            Design a comprehensive learning experience
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Module Information</CardTitle>
            <CardDescription>
              General details about the learning module
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Module Title *</Label>
              <Input
                id="title"
                value={module.title}
                onChange={(e) =>
                  setModule({ ...module, title: e.target.value })
                }
                placeholder="e.g., Introduction to Computer Basics"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={module.description}
                onChange={(e) =>
                  setModule({ ...module, description: e.target.value })
                }
                placeholder="Brief description of what students will learn"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select
                  value={module.skillLevel}
                  onValueChange={(value) =>
                    setModule({ ...module, skillLevel: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={module.duration}
                  onChange={(e) =>
                    setModule({
                      ...module,
                      duration: parseInt(e.target.value) || 30,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={module.order}
                  onChange={(e) =>
                    setModule({
                      ...module,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Lessons ({lessons.length})
            </h2>
          </div>

          {lessons.map((lesson, lIndex) => (
            <Card key={lesson.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Lesson {lIndex + 1}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateLesson(lIndex)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Duplicate
                    </Button>
                    {lessons.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(lIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Lesson Title *</Label>
                  <Input
                    value={lesson.title}
                    onChange={(e) =>
                      updateLesson(lIndex, "title", e.target.value)
                    }
                    placeholder="Enter lesson title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={lesson.content}
                    onChange={(e) =>
                      updateLesson(lIndex, "content", e.target.value)
                    }
                    placeholder="Lesson content and instructions"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Video URL (Optional)</Label>
                  <Input
                    value={lesson.videoUrl}
                    onChange={(e) =>
                      updateLesson(lIndex, "videoUrl", e.target.value)
                    }
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Resource URL (Optional)</Label>
                  <Input
                    value={lesson.resourceUrl}
                    onChange={(e) =>
                      updateLesson(lIndex, "resourceUrl", e.target.value)
                    }
                    placeholder="https://example.com/resource.pdf"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Lesson below last lesson */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors">
            <CardContent className="py-8">
              <Button
                onClick={addLesson}
                variant="ghost"
                className="w-full h-full text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Lesson
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/learning-modules")}
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
