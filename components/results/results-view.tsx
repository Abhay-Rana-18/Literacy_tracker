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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { api } from "@/lib/api";

interface AssessmentResult {
  _id: string;
  assessmentId: {
    _id: string;
    title: string;
  };
  score: number;
  maxScore: number;
  percentage: number;
  digitalLiteracyLevel: string;
  feedback: string;
  createdAt: string;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
}

export default function ResultsView() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const data = await api.get("/results");
      setResults(data);

      if (data.length > 0) {
        setSelectedResult(data[data.length - 1]); // Show most recent result
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load results");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const skillLevelColor = {
    literate: "#16a34a",
    "semi-literate": "#f59e0b",
    illiterate: "#dc2626",
  } as Record<string, string>;

  const getProgressHistory = () => {
    return results
      .slice(-10)
      .map((result) => ({
        date: new Date(result.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: result.percentage,
        assessment: result.assessmentId.title.substring(0, 20),
      }))
      .reverse();
  };

  const getPieData = () => {
    if (!selectedResult) return [];
    const correct = selectedResult.answers.filter((a) => a.isCorrect).length;
    const incorrect = selectedResult.answers.length - correct;
    return [
      { name: "Correct", value: correct, color: "#16a34a" },
      { name: "Incorrect", value: incorrect, color: "#e5e7eb" },
    ];
  };

  const getSkillLevelDistribution = () => {
    const distribution = {
      literate: 0,
      "semi-literate": 0,
      illiterate: 0,
    };

    results.forEach((result) => {
      distribution[result.digitalLiteracyLevel as keyof typeof distribution]++;
    });

    return [
      { name: "Literate", value: distribution.literate, color: "#16a34a" },
      {
        name: "Semi-Literate",
        value: distribution["semi-literate"],
        color: "#f59e0b",
      },
      { name: "Illiterate", value: distribution.illiterate, color: "#dc2626" },
    ].filter((item) => item.value > 0);
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    return Math.round(
      results.reduce((acc, result) => acc + result.percentage, 0) /
        results.length
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">
            Loading results...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 px-3 sm:px-6">
            <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={fetchResults} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-2">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 px-3 sm:px-6 text-center space-y-4">
            <p className="text-gray-600 text-sm sm:text-base">
              No assessment results yet. Start an assessment to see your
              results.
            </p>
            <Button
              onClick={() => router.push("/assessment")}
              className="w-full"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correctAnswers =
    selectedResult?.answers.filter((a) => a.isCorrect).length || 0;
  const totalQuestions = selectedResult?.answers.length || 0;

  return (
    <div className="space-y-4 sm:space-y-8 p-2 sm:p-6">
      <div className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-3xl font-bold text-neutral-900">
          Your Assessment Results
        </h1>
        <p className="text-neutral-600 mt-1 sm:mt-2 text-xs sm:text-base">
          {results.length} assessment{results.length !== 1 ? "s" : ""} completed
          • Average score: {getAverageScore()}%
        </p>
      </div>

      {/* Assessment Selector */}
      {results.length > 1 && (
        <Card>
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
            <CardTitle className="text-base sm:text-lg">
              Select Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => setSelectedResult(result)}
                  className={`p-2 sm:p-3 border-2 rounded-lg text-left transition ${
                    selectedResult?._id === result._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm truncate">
                    {result.assessmentId.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    {new Date(result.createdAt).toLocaleDateString()} •{" "}
                    {result.percentage}%
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedResult && (
        <>
          {/* Main Score Card */}
          <Card
            className="border-2"
            style={{
              borderColor:
                skillLevelColor[
                  selectedResult.digitalLiteracyLevel.toLowerCase()
                ],
            }}
          >
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <CardTitle className="text-base sm:text-lg">
                {selectedResult.assessmentId.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Completed on{" "}
                {new Date(selectedResult.createdAt).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="flex flex-col items-center justify-center py-4">
                  <div
                    className="text-4xl sm:text-6xl font-bold"
                    style={{
                      color:
                        skillLevelColor[
                          selectedResult.digitalLiteracyLevel.toLowerCase()
                        ],
                    }}
                  >
                    {selectedResult.percentage}%
                  </div>
                  <div
                    className="text-lg sm:text-2xl font-semibold mt-2 capitalize"
                    style={{
                      color:
                        skillLevelColor[
                          selectedResult.digitalLiteracyLevel.toLowerCase()
                        ],
                    }}
                  >
                    {selectedResult.digitalLiteracyLevel}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-neutral-50 rounded-lg">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-sm text-neutral-600">
                      Correct
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">
                      {correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-neutral-600">
                      Incorrect
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {totalQuestions - correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-neutral-600">
                      Score
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {selectedResult.score}/{selectedResult.maxScore}
                    </p>
                  </div>
                </div>
              </div>

              {selectedResult.feedback && (
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-900 text-xs sm:text-base">
                    {selectedResult.feedback}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Chart */}
          {results.length > 1 && (
            <Card>
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="text-base sm:text-lg">
                  Progress Over Time
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your assessment scores progression
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getProgressHistory()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Skill Level Distribution */}
          {results.length > 3 && (
            <Card>
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="text-base sm:text-lg">
                  Skill Level Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your performance across all assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={getSkillLevelDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {getSkillLevelDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <CardTitle className="text-base sm:text-lg">
                Personalized Recommendations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Based on your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ul className="space-y-2 sm:space-y-3">
                {selectedResult.digitalLiteracyLevel === "illiterate" && (
                  <>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Focus on basic computer fundamentals and internet
                        browsing
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Take the beginner-level learning modules
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Practice basic email and document handling regularly
                      </span>
                    </li>
                  </>
                )}
                {selectedResult.digitalLiteracyLevel === "semi-literate" && (
                  <>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Continue with intermediate modules to strengthen weak
                        areas
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Focus on online safety and data protection practices
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Explore advanced features of common applications
                      </span>
                    </li>
                  </>
                )}
                {selectedResult.digitalLiteracyLevel === "literate" && (
                  <>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Excellent performance! Continue learning advanced topics
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Consider exploring specialized skills and tools
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span className="text-xs sm:text-base">
                        Help peers with their digital literacy journey
                      </span>
                    </li>
                  </>
                )}
              </ul>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  onClick={() => router.push("/learning-modules")}
                  className="flex-1"
                >
                  Continue Learning
                </Button>
                <Button
                  onClick={() => router.push("/assessment")}
                  variant="outline"
                  className="flex-1"
                >
                  Take Another Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
