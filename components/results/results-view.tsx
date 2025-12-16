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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchResults}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-gray-600">
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
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          Your Assessment Results
        </h1>
        <p className="text-neutral-600 mt-2">
          {results.length} assessment{results.length !== 1 ? "s" : ""} completed
          • Average score: {getAverageScore()}%
        </p>
      </div>

      {/* Assessment Selector */}
      {results.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => setSelectedResult(result)}
                  className={`p-3 border-2 rounded-lg text-left transition ${
                    selectedResult?._id === result._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-sm">
                    {result.assessmentId.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
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
            <CardHeader>
              <CardTitle>{selectedResult.assessmentId.title}</CardTitle>
              <CardDescription>
                Completed on{" "}
                {new Date(selectedResult.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="text-6xl font-bold"
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
                    className="text-2xl font-semibold mt-2 capitalize"
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
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600">Correct Answers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">
                      Incorrect Answers
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalQuestions - correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Score</p>
                    <p className="text-2xl font-bold">
                      {selectedResult.score}/{selectedResult.maxScore}
                    </p>
                  </div>
                </div>
              </div>

              {selectedResult.feedback && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-900">{selectedResult.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Chart */}
          {results.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>
                  Your assessment scores progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getProgressHistory()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Skill Level Distribution */}
          {results.length > 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Skill Level Distribution</CardTitle>
                <CardDescription>
                  Your performance across all assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getSkillLevelDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
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
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Based on your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {selectedResult.digitalLiteracyLevel === "illiterate" && (
                  <>
                    <li className="flex gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span>
                        Focus on basic computer fundamentals and internet
                        browsing
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Take the beginner-level learning modules</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-red-600 font-bold">•</span>
                      <span>
                        Practice basic email and document handling regularly
                      </span>
                    </li>
                  </>
                )}
                {selectedResult.digitalLiteracyLevel === "semi-literate" && (
                  <>
                    <li className="flex gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>
                        Continue with intermediate modules to strengthen weak
                        areas
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>
                        Focus on online safety and data protection practices
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>
                        Explore advanced features of common applications
                      </span>
                    </li>
                  </>
                )}
                {selectedResult.digitalLiteracyLevel === "literate" && (
                  <>
                    <li className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>
                        Excellent performance! Continue learning advanced topics
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>
                        Consider exploring specialized skills and tools
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>
                        Help peers with their digital literacy journey
                      </span>
                    </li>
                  </>
                )}
              </ul>

              <div className="mt-6 flex gap-4">
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
