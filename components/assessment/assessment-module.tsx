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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Copy,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  skillCategory: string;
  questions: Question[];
  totalPoints: number;
  timeLimit?: number;
}

interface SubmitAnswer {
  questionId: string;
  userAnswer: string;
}

interface Statistics {
  assessment: {
    id: string;
    title: string;
    totalQuestions: number;
  };
  statistics: {
    totalAttempts: number;
    averageScore: number;
    scoreDistribution: {
      literate: number;
      semiLiterate: number;
      illiterate: number;
    };
    highestScore: number;
    lowestScore: number;
  };
  recentResults: Array<{
    studentName: string;
    studentEmail: string;
    score: number;
    completedAt: string;
  }>;
}

export default function AssessmentModule() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(
    null
  );
  const [showStats, setShowStats] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // AI generator state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiConfig, setAiConfig] = useState({
    ageGroup: "13-18",
    difficulty: "medium",
    questionCount: 10,
  });

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const data = await api.get("/assessments");
      setAssessments(data);

      if (data.length > 0) {
        setSelectedAssessment(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load assessments");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (assessmentId: string) => {
    setLoadingStats(true);
    try {
      const data = await api.get(`/assessments/${assessmentId}/statistics`);
      setStatistics(data);
      setShowStats(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (!assessmentToDelete) return;

    try {
      await api.delete(`/assessments/${assessmentToDelete}`);
      const updated = assessments.filter((a) => a._id !== assessmentToDelete);
      setAssessments(updated);
      if (selectedAssessment?._id === assessmentToDelete) {
        setSelectedAssessment(updated.length > 0 ? updated[0] : null);
      }
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete assessment");
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async (assessmentId: string) => {
    try {
      const response = await api.post(`/assessments/${assessmentId}/duplicate`);
      setAssessments([...assessments, response.assessment]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to duplicate assessment");
    }
  };

  const handleStart = () => {
    if (!selectedAssessment) return;
    setIsStarted(true);
    setIsCompleted(false);
    setAnswers({});
    setCurrentQuestion(0);
  };

  const handleAnswer = (questionId: string, answerValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerValue,
    }));
  };

  const handleNext = () => {
    if (
      selectedAssessment &&
      currentQuestion < selectedAssessment.questions.length - 1
    ) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssessment) return;

    setSubmitting(true);
    setError("");

    try {
      const submitAnswers: SubmitAnswer[] = Object.entries(answers).map(
        ([questionId, userAnswer]) => ({
          questionId,
          userAnswer,
        })
      );

      const response = await api.post("/assessments/submit", {
        assessmentId: selectedAssessment._id,
        answers: submitAnswers,
      });

      setResult(response.result);
      setIsCompleted(true);
      setIsStarted(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    if (!selectedAssessment) return 0;
    return ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-3">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">
            Loading assessments...
          </p>
        </div>
      </div>
    );
  }

  if (error && !selectedAssessment) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-3">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 px-4 sm:px-6">
            <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={fetchAssessments} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-3">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 px-4 sm:px-6 text-center space-y-4">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              No assessments available at the moment
            </p>
            {(userRole === "teacher" || userRole === "admin") && (
              <Button
                onClick={() => router.push("/assessment/add")}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Statistics view
  if (showStats && statistics) {
    return (
      <div className="max-w-4xl mx-auto px-2 py-3 sm:px-6 sm:py-6">
        <Button
          variant="outline"
          onClick={() => setShowStats(false)}
          className="mb-4 text-sm"
          size="sm"
        >
          ← Back
        </Button>

        <Card>
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
            <CardTitle className="text-lg sm:text-xl">
              {statistics.assessment.title} - Statistics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {statistics.assessment.totalQuestions} questions
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Card>
                <CardContent className="pt-3 pb-3 px-2 sm:pt-6 sm:pb-6 sm:px-6">
                  <div className="text-xl sm:text-2xl font-bold">
                    {statistics.statistics.totalAttempts}
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600">
                    Total Attempts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-2 sm:pt-6 sm:pb-6 sm:px-6">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {statistics.statistics.averageScore}%
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600">
                    Average Score
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-2 sm:pt-6 sm:pb-6 sm:px-6">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {statistics.statistics.highestScore}%
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600">
                    Highest Score
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 px-2 sm:pt-6 sm:pb-6 sm:px-6">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {statistics.statistics.lowestScore}%
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600">
                    Lowest Score
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">
                  Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium text-xs sm:text-sm">
                    Literate (≥70%)
                  </span>
                  <span className="font-bold text-sm sm:text-base">
                    {statistics.statistics.scoreDistribution.literate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-700 font-medium text-xs sm:text-sm">
                    Semi-Literate (50-69%)
                  </span>
                  <span className="font-bold text-sm sm:text-base">
                    {statistics.statistics.scoreDistribution.semiLiterate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-700 font-medium text-xs sm:text-sm">
                    Illiterate (&lt;50%)
                  </span>
                  <span className="font-bold text-sm sm:text-base">
                    {statistics.statistics.scoreDistribution.illiterate}
                  </span>
                </div>
              </CardContent>
            </Card>

            {statistics.recentResults.length > 0 && (
              <Card>
                <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">
                    Recent Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    {statistics.recentResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {result.studentName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {result.studentEmail}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p
                            className={`font-bold text-base sm:text-lg ${
                              result.score >= 70
                                ? "text-green-600"
                                : result.score >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.score}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(result.completedAt).toLocaleDateString()}
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

  if (!isStarted && !isCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-2 py-3 sm:px-6 sm:py-6">
        <Card>
          <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Digital Skills Assessment
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Choose an assessment or generate a personalized one with AI.
                </CardDescription>
              </div>
              {(userRole === "teacher" || userRole === "admin") && (
                <Button
                  onClick={() => router.push("/assessment/add")}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {/* AI generator for students */}
            {userRole === "student" && (
              <Card className="border border-dashed border-neutral-300 bg-neutral-50/70">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-sm sm:text-base">
                    Generate assessment with AI
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Select your age group, difficulty, and number of questions
                    to get a tailored test.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-4 space-y-3 sm:space-y-4">
                  {aiError && (
                    <div className="p-2 sm:p-3 rounded-md bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
                      {aiError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm">Age group</Label>
                      <RadioGroup
                        value={aiConfig.ageGroup}
                        onValueChange={(value) =>
                          setAiConfig((prev) => ({ ...prev, ageGroup: value }))
                        }
                      >
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="8-12" />
                            <span>8 – 12 years</span>
                          </Label>
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="13-18" />
                            <span>13 – 18 years</span>
                          </Label>
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="18+" />
                            <span>18+ years</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm">Difficulty</Label>
                      <RadioGroup
                        value={aiConfig.difficulty}
                        onValueChange={(value) =>
                          setAiConfig((prev) => ({
                            ...prev,
                            difficulty: value,
                          }))
                        }
                      >
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="easy" />
                            <span>Easy</span>
                          </Label>
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="medium" />
                            <span>Medium</span>
                          </Label>
                          <Label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                            <RadioGroupItem value="hard" />
                            <span>Hard</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm">
                        No. of questions
                      </Label>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={aiConfig.questionCount}
                        onChange={(e) =>
                          setAiConfig((prev) => ({
                            ...prev,
                            questionCount: Math.max(
                              3,
                              Math.min(30, Number(e.target.value) || 0)
                            ),
                          }))
                        }
                        className="h-9 w-full rounded-md border border-neutral-300 px-2 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={aiGenerating}
                    onClick={async () => {
                      if (!aiConfig.questionCount || aiConfig.questionCount < 3)
                        return;
                      try {
                        setAiError("");
                        setAiGenerating(true);

                        const data = await api.post(
                          "/ai-assessments/generate",
                          {
                            ageGroup: aiConfig.ageGroup,
                            // difficulty: aiConfig.difficulty,
                            questionCount: aiConfig.questionCount,
                          }
                        );

                        const generated: Assessment = data.assessment;
                        setAssessments((prev) => [...prev, generated]);
                        setSelectedAssessment(generated);
                        setIsStarted(true);
                        setIsCompleted(false);
                        setAnswers({});
                        setCurrentQuestion(0);
                      } catch (err: any) {
                        setAiError(
                          err?.response?.data?.error ||
                            "Failed to generate assessment. Please try again."
                        );
                      } finally {
                        setAiGenerating(false);
                      }
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {aiGenerating ? "Generating..." : "Generate with AI"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {assessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className={`p-3 sm:p-4 border-2 rounded-lg transition ${
                    selectedAssessment?._id === assessment._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div
                      onClick={() => setSelectedAssessment(assessment)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <h3 className="font-semibold text-base sm:text-lg">
                        {assessment.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {assessment.description}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                        <span>📝 {assessment.questions.length} questions</span>
                        <span className="capitalize">
                          📊 {assessment.skillCategory}
                        </span>
                        {assessment.timeLimit && (
                          <span>⏱️ {assessment.timeLimit} min</span>
                        )}
                      </div>
                    </div>

                    {(userRole === "teacher" || userRole === "admin") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => fetchStatistics(assessment._id)}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Statistics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/assessment/edit/${assessment._id}`)
                            }
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(assessment._id)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setAssessmentToDelete(assessment._id);
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
              ))}
            </div>

            {selectedAssessment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                  Assessment Overview:
                </h3>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <li>• {selectedAssessment.questions.length} questions</li>
                  {selectedAssessment.timeLimit && (
                    <li>
                      • Time limit: {selectedAssessment.timeLimit} minutes
                    </li>
                  )}
                  <li>• Multiple choice format</li>
                  <li>• Your results will determine your skill level</li>
                  <li>• Total points: {selectedAssessment.totalPoints}</li>
                </ul>
              </div>
            )}

            {userRole === "student" && (
              <Button
                onClick={handleStart}
                className="w-full"
                disabled={!selectedAssessment}
              >
                Start Assessment
              </Button>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg mx-2">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Are you sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                This action cannot be undone. This will permanently delete the
                assessment.
                {assessments.find((a) => a._id === assessmentToDelete) && (
                  <span className="block mt-2 font-semibold">
                    Note: If students have taken this assessment, deletion will
                    be prevented.
                  </span>
                )}
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
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isCompleted && result) {
    return (
      <div className="max-w-2xl mx-auto px-2 py-3 sm:px-6 sm:py-6">
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              Assessment Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-4 sm:space-y-6">
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                {result.percentage}%
              </div>
              <div className="text-xl sm:text-2xl font-semibold mb-4">
                Your Level:{" "}
                <span className="text-yellow-600 capitalize">
                  {result.digitalLiteracyLevel}
                </span>
              </div>
              <div className="text-neutral-600 text-sm sm:text-base">
                You scored {result.score} out of{" "}
                {selectedAssessment?.totalPoints} points
              </div>
              {result.feedback && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-900 text-sm sm:text-base">
                    {result.feedback}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/learning-modules")}
                variant="outline"
                className="flex-1"
              >
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedAssessment) return null;

  const currentQ = selectedAssessment.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto px-2 py-3 sm:px-6 sm:py-6">
      <Card>
        <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg">
                Question {currentQuestion + 1} of{" "}
                {selectedAssessment.questions.length}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedAssessment.title}
              </CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-sm font-semibold text-neutral-600">
                {Math.round(getProgress())}%
              </span>
              <p className="text-xs text-gray-500">
                {getAnsweredCount()} answered
              </p>
            </div>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </CardHeader>

        <CardContent className="px-3 sm:px-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-4">
              {currentQ.question}
            </h2>

            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
            >
              <div className="space-y-2 sm:space-y-3">
                {currentQ.options.map((option, idx) => (
                  <Label
                    key={idx}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-4 border rounded-lg cursor-pointer transition ${
                      answers[currentQ.id] === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option}
                      id={`option-${idx}`}
                      className="flex-shrink-0"
                    />
                    <span className="font-medium text-neutral-900 text-sm sm:text-base">
                      {option}
                    </span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 sm:gap-4 justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Previous
            </Button>

            {currentQuestion === selectedAssessment.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  getAnsweredCount() < selectedAssessment.questions.length
                }
                className="flex-1"
                size="sm"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1" size="sm">
                Next
              </Button>
            )}
          </div>

          {getAnsweredCount() < selectedAssessment.questions.length &&
            currentQuestion === selectedAssessment.questions.length - 1 && (
              <p className="text-xs sm:text-sm text-amber-600 text-center">
                Please answer all questions before submitting
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
