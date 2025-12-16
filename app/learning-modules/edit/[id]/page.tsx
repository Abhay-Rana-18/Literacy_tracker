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
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  resourceUrl: string;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  skillLevel: string;
  lessons: Lesson[];
  duration: number;
  order: number;
}

export default function EditLearningModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [module, setModule] = useState({
    title: "",
    description: "",
    skillLevel: "basic",
    duration: 30,
    order: 1,
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    checkAuthAndFetch();
  }, [moduleId]);

  const checkAuthAndFetch = async () => {
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

    await fetchModule();
  };

  const fetchModule = async () => {
    try {
      const data: Module = await api.get(`/learning-modules/${moduleId}`);

      setModule({
        title: data.title,
        description: data.description,
        skillLevel: data.skillLevel,
        duration: data.duration || 30,
        order: data.order || 1,
      });

      setLessons(data.lessons);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load module");
      if (err.response?.status === 404) {
        router.push("/learning-modules");
      }
    } finally {
      setLoading(false);
    }
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

  const handleUpdate = async () => {
    setUpdating(true);
    setError("");

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

      await api.put(`/learning-modules/${moduleId}`, moduleData);

      router.push("/learning-modules");
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to update module"
      );
    } finally {
      setUpdating(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
            Edit Learning Module
          </h1>
          <p className="text-gray-600 mt-2">
            Update module details and lessons
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
            <Card
              key={lesson.id ?? lIndex}
              className="border-l-4 border-l-green-500"
            >
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
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="flex-1"
              disabled={updating}
            >
              <Save className="w-4 h-4 mr-2" />
              {updating ? "Updating..." : "Update Module"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
