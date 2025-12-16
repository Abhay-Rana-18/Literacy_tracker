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
import { Plus, Trash2, Check, ArrowLeft } from "lucide-react";

interface NewQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function AddAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [assessment, setAssessment] = useState({
    title: "",
    description: "",
    skillCategory: "basic",
    totalPoints: 100,
    timeLimit: 30,
  });

  const [questions, setQuestions] = useState<NewQuestion[]>([
    {
      id: "1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: (questions.length + 1).toString(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...questions[index] };
    questionToDuplicate.id = (questions.length + 1).toString();
    setQuestions([...questions, questionToDuplicate]);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    if (
      field === "question" ||
      field === "correctAnswer" ||
      field === "explanation"
    ) {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setCreating(true);
    setError("");
    setSuccess(false);

    try {
      // Validation
      if (!assessment.title.trim() || !assessment.description.trim()) {
        throw new Error("Please fill in all required fields");
      }

      const validQuestions = questions.filter((q) => {
        const hasQuestion = q.question.trim() !== "";
        const hasOptions =
          q.options.filter((opt) => opt.trim() !== "").length >= 2;
        const hasCorrectAnswer = q.correctAnswer.trim() !== "";
        return hasQuestion && hasOptions && hasCorrectAnswer;
      });

      if (validQuestions.length === 0) {
        throw new Error("Please add at least one complete question");
      }

      const assessmentData = {
        ...assessment,
        questions: validQuestions,
      };

      await api.post("/assessments", assessmentData);
      setSuccess(true);

      setTimeout(() => {
        router.push("/assessment");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create assessment"
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
              Assessment Created!
            </h2>
            <p className="text-gray-600">Redirecting to assessments...</p>
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
            onClick={() => router.push("/assessment")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Assessment
          </h1>
          <p className="text-gray-600 mt-2">
            Design a comprehensive digital literacy assessment
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
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General details about your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                value={assessment.title}
                onChange={(e) =>
                  setAssessment({ ...assessment, title: e.target.value })
                }
                placeholder="e.g., Basic Computer Skills Assessment"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={assessment.description}
                onChange={(e) =>
                  setAssessment({ ...assessment, description: e.target.value })
                }
                placeholder="Brief description of what this assessment covers"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Skill Category</Label>
                <Select
                  value={assessment.skillCategory}
                  onValueChange={(value) =>
                    setAssessment({ ...assessment, skillCategory: value })
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
                <Label htmlFor="points">Total Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={assessment.totalPoints}
                  onChange={(e) =>
                    setAssessment({
                      ...assessment,
                      totalPoints: parseInt(e.target.value) || 100,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="time">Time Limit (minutes)</Label>
                <Input
                  id="time"
                  type="number"
                  value={assessment.timeLimit}
                  onChange={(e) =>
                    setAssessment({
                      ...assessment,
                      timeLimit: parseInt(e.target.value) || 30,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Questions ({questions.length})
            </h2>
            <Button onClick={addQuestion} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {questions.map((question, qIndex) => (
            <Card key={question.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Question {qIndex + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateQuestion(qIndex)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Duplicate
                    </Button>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                  <Label>Question *</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(qIndex, "question", e.target.value)
                    }
                    placeholder="Enter your question here"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* Options */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Answer Options *</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                      className="text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <Label>Correct Answer *</Label>
                  <Select
                    value={question.correctAnswer}
                    onValueChange={(value) =>
                      updateQuestion(qIndex, "correctAnswer", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options
                        .filter((opt) => opt.trim() !== "")
                        .map((option, idx) => (
                          <SelectItem key={idx} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Explanation */}
                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={(e) =>
                      updateQuestion(qIndex, "explanation", e.target.value)
                    }
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/assessment")}
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
              {creating ? "Creating Assessment..." : "Create Assessment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
