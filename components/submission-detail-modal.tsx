"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  user_email: string;
  stage: number;
  data: any;
  created_at: string;
  updated_at: string;
  score?: number;
  ai_evaluations?: any;
  filtering_decision?: "auto" | "exclude" | "nominated";
  channel?: string | null;
  note?: string | null;
};

type FormField = {
  id: string;
  field_name: string;
  label: string;
  field_type: string;
  options?: any;
  has_weight?: boolean;
  question_title?: string;
  is_ai_calculated?: boolean;
  display_order?: number;
  stage?: number;
  weight?: number;
};

type StageData = {
  stage: number;
  score: number;
  data: any;
  ai_evaluations?: any;
  created_at: string;
};

interface SubmissionDetailModalProps {
  submission: Submission | null;
  formFields: FormField[];
  onClose: () => void;
}

export function SubmissionDetailModal({
  submission,
  formFields,
  onClose,
}: SubmissionDetailModalProps) {
  const [activeTab, setActiveTab] = useState(1);
  const [allStageData, setAllStageData] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (submission) {
      loadAllStageData();
    }
  }, [submission]);

  const loadAllStageData = async () => {
    if (!submission) return;

    setLoading(true);
    try {
      // Read from stage-specific data columns
      const stageDataMap: Record<number, StageData> = {};

      // Group fields by stage
      const fieldsByStage: Record<number, FormField[]> = {
        1: formFields.filter((f) => f.stage === 1),
        2: formFields.filter((f) => f.stage === 2),
        3: formFields.filter((f) => f.stage === 3),
      };

      // Process each stage using stage-specific data columns
      [1, 2, 3].forEach((stageNum) => {
        const stageFields = fieldsByStage[stageNum];

        // Get data from stage-specific column
        // Stage 1: data, Stage 2: data_stage_2, Stage 3: data_stage_3
        let stageData: any = {};
        let stageAiEvaluations: any = {};

        if (stageNum === 1) {
          stageData = submission.data || {};
          stageAiEvaluations = submission.ai_evaluations || {};
        } else if (stageNum === 2) {
          stageData = (submission as any).data_stage_2 || {};
          stageAiEvaluations = (submission as any).ai_evaluations_stage_2 || {};
        } else if (stageNum === 3) {
          stageData = (submission as any).data_stage_3 || {};
          stageAiEvaluations = (submission as any).ai_evaluations_stage_3 || {};
        }

        let hasData = false;

        // Check if this stage has any data
        stageFields.forEach((field) => {
          if (stageData[field.field_name] !== undefined) {
            hasData = true;
          }
        });

        if (hasData) {
          // Calculate stage score (sum of weighted fields for this stage)
          let stageScore = 0;

          // Calculate scores for regular (non-AI) fields
          stageFields.forEach((field) => {
            // Skip AI fields - we'll calculate them separately
            if (field.is_ai_calculated) return;

            if (field.has_weight && stageData[field.field_name] !== undefined) {
              const selectedOption = field.options?.options?.find(
                (opt: any) => opt.value === stageData[field.field_name]
              );
              if (selectedOption?.weight !== undefined) {
                if (stageNum === 2) {
                  // For Stage 2: 1000 points if correct (weight > 0), 0 if wrong
                  stageScore += selectedOption.weight > 0 ? 1000 : 0;
                } else {
                  // For other stages, use weight as-is
                  stageScore += selectedOption.weight;
                }
              }
            }
          });

          // Add AI evaluation scores separately (once per AI question, not per field)
          if (
            stageAiEvaluations &&
            Object.keys(stageAiEvaluations).length > 0
          ) {
            Object.values(stageAiEvaluations).forEach((aiEval: any) => {
              if (aiEval?.evaluation) {
                // Try to extract score from AI evaluation
                const evaluation = aiEval.evaluation;
                if (
                  typeof evaluation === "object" &&
                  !Array.isArray(evaluation)
                ) {
                  // Sum up all criterion results
                  const breakdownEntries = Object.entries(evaluation).filter(
                    ([key]) => !["error", "total"].includes(key)
                  );
                  const aiScore = breakdownEntries.reduce(
                    (sum, [_, data]: [string, any]) => {
                      if (typeof data === "object" && data !== null) {
                        // For Stage 3: use result instead of score
                        if (stageNum === 3 && typeof data.result === "number") {
                          return sum + data.result;
                        }
                        // For other stages: use score
                        if (typeof data.score === "number") {
                          return sum + data.score;
                        }
                      }
                      return sum;
                    },
                    0
                  );
                  stageScore += aiScore;
                }
              }
            });
          }

          stageDataMap[stageNum] = {
            stage: stageNum,
            score: stageScore,
            data: stageData,
            ai_evaluations: stageAiEvaluations,
            created_at: submission.created_at,
          };
        }
      });

      setAllStageData(Object.values(stageDataMap));
      // Set active tab to current submission's stage
      setActiveTab(submission.stage);
    } catch (error) {
      console.error("Error processing stage data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!submission) return null;

  const calculateTotalScore = () => {
    return allStageData.reduce((sum, stage) => sum + (stage.score || 0), 0);
  };

  const getStageFields = (stage: number) => {
    return formFields.filter((f) => f.stage === stage);
  };

  const currentStageData = allStageData.find((s) => s.stage === activeTab) || {
    stage: activeTab,
    score: 0,
    data: {},
    ai_evaluations: null,
    created_at: submission.created_at,
  };

  const getFieldLabel = (fieldName: string): string => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.label || fieldName;
  };

  const getOptionsArray = (opts: any): Array<{ label: string; value: any }> => {
    if (!opts) return [];
    if (Array.isArray(opts)) return opts as any[];
    if (Array.isArray(opts?.options)) return opts.options as any[];
    return [];
  };

  const renderValue = (value: any, field: FormField | undefined) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">لا يوجد</span>;
    }

    // Handle objects
    if (typeof value === "object") {
      // Check if it's an array
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            {value.map((item, idx) => (
              <div key={idx} className="text-sm">
                {typeof item === "string" ? item : JSON.stringify(item)}
              </div>
            ))}
          </div>
        );
      }
      // For other objects, stringify
      return (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // Handle simple values with options
    const selectedOption = field?.options?.options?.find(
      (opt: any) => opt.value === value
    );

    return <span>{selectedOption?.label || String(value)}</span>;
  };

  const renderAIEvaluation = (aiEvaluation: any, stage: number = activeTab) => {
    if (!aiEvaluation) return null;

    const evaluation = aiEvaluation.evaluation;

    // Check if evaluation has the breakdown structure (multiple criteria)
    if (
      evaluation &&
      typeof evaluation === "object" &&
      !("score" in evaluation && "explanation" in evaluation)
    ) {
      // This is a breakdown with multiple criteria
      const breakdownEntries = Object.entries(evaluation).filter(
        ([key]) => !["error", "total"].includes(key)
      );

      if (breakdownEntries.length > 0) {
        // Calculate total raw score (sum of all criterion scores)
        // For Stage 3: sum results instead of scores
        const totalScore = breakdownEntries.reduce(
          (sum, [_, data]: [string, any]) => {
            if (typeof data === "object" && data !== null) {
              // For Stage 3: use result if available, otherwise score
              if (stage === 3 && typeof data.result === "number") {
                return sum + data.result;
              }
              // For other stages: use score
              if (typeof data.score === "number") {
                return sum + data.score;
              }
            }
            return sum;
          },
          0
        );

        return (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                تقييم الذكاء الاصطناعي - تفصيل المعايير
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                المجموع: {totalScore.toFixed(1)}
              </span>
            </div>
            <div className="space-y-2">
              {breakdownEntries.map(([criterion, data]: [string, any]) => {
                // Handle if data is a simple value
                if (typeof data !== "object" || data === null) {
                  return (
                    <div
                      key={criterion}
                      className="bg-white p-3 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">
                          {criterion}
                        </span>
                        <span className="text-xs text-gray-600">
                          {String(data)}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Handle structured data with score/explanation/weight/result
                const score = typeof data.score === "number" ? data.score : 0;
                const weight =
                  typeof data.weight === "number" ? data.weight : 0;
                const result =
                  typeof data.result === "number" ? data.result : 0;
                const explanation = data.explanation || "";
                // Extract scale from data if available
                const scale =
                  typeof data.scale === "number" ? data.scale : null;

                return (
                  <div
                    key={criterion}
                    className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-800 flex-1">
                        {criterion}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-blue-600">
                          {score}
                          {scale ? ` / ${scale}` : ""}
                        </span>
                        {stage === 3 && (
                          <span className="text-xs font-bold text-green-600">
                            النتيجة: {result}
                          </span>
                        )}
                      </div>
                    </div>
                    {explanation && typeof explanation === "string" && (
                      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded">
                        {explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    // Check if evaluation is a simple object with score/explanation (fallback)
    if (
      evaluation &&
      typeof evaluation === "object" &&
      ("score" in evaluation || "explanation" in evaluation)
    ) {
      const score = typeof evaluation.score === "number" ? evaluation.score : 0;

      return (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              تقييم الذكاء الاصطناعي
            </span>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                score >= 700
                  ? "bg-green-500 text-white"
                  : score >= 400
                  ? "bg-yellow-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {score}
            </span>
          </div>
          {evaluation.explanation &&
            typeof evaluation.explanation === "string" && (
              <p className="text-xs text-blue-800 leading-relaxed">
                {evaluation.explanation}
              </p>
            )}
          {evaluation.error && (
            <p className="text-xs text-red-600 mt-2">⚠️ حدث خطأ في التقييم</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-6 text-white flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <Award className="w-8 h-8" />
                    تفاصيل المشارك
                  </h2>
                  <p className="text-white/90 text-sm mb-3">
                    {submission.user_email}
                  </p>

                  {/* Total Score Banner */}
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
                    <div className="flex-1">
                      <p className="text-white/80 text-xs mb-1">
                        المجموع الكلي
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">
                          {calculateTotalScore().toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((stage) => {
                        const stageData = allStageData.find(
                          (s) => s.stage === stage
                        );
                        const stageScore = stageData?.score || 0;
                        return (
                          <div
                            key={stage}
                            className="text-center bg-white/10 rounded-lg p-2 min-w-[70px]"
                          >
                            <p className="text-white/70 text-xs mb-1">
                              المرحلة {stage}
                            </p>
                            <p className="text-lg font-bold text-white">
                              {stageScore.toFixed(1)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stage Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 px-6 py-3">
                {[1, 2, 3].map((stage) => {
                  const stageData = allStageData.find((s) => s.stage === stage);
                  const hasData = !!stageData;
                  const isActive = activeTab === stage;

                  return (
                    <button
                      key={stage}
                      onClick={() => setActiveTab(stage)}
                      disabled={!hasData}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-lg"
                          : hasData
                          ? "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span>المرحلة {stage}</span>
                      {hasData && (
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            isActive ? "text-white" : "text-green-500"
                          }`}
                        />
                      )}
                      {!hasData && <AlertCircle className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A3984] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحميل...</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Stage Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            المرحلة {currentStageData.stage}
                          </h3>
                          <p className="text-sm text-gray-600">
                            تاريخ التقديم:{" "}
                            {new Date(
                              currentStageData.created_at
                            ).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">النقاط</p>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="text-3xl font-bold text-[#2A3984]">
                              {currentStageData.score?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fields & Answers */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-[#2A3984] to-[#3a4a9f] rounded-full"></span>
                        الإجابات المقدمة
                      </h4>

                      {/* Separate AI and non-AI fields */}
                      {(() => {
                        const allEntries = Object.entries(
                          currentStageData.data || {}
                        )
                          .sort(([fieldNameA], [fieldNameB]) => {
                            const fieldA = getStageFields(activeTab).find(
                              (f) => f.field_name === fieldNameA
                            );
                            const fieldB = getStageFields(activeTab).find(
                              (f) => f.field_name === fieldNameB
                            );
                            return (
                              (fieldA?.display_order || 999) -
                              (fieldB?.display_order || 999)
                            );
                          })
                          .map(([fieldName, value]) => {
                            const field = getStageFields(activeTab).find(
                              (f) => f.field_name === fieldName
                            );
                            return { fieldName, value, field };
                          })
                          .filter(({ field }) => field);

                        const aiFields = allEntries.filter(
                          ({ field }) => field?.is_ai_calculated
                        );
                        const nonAIFields = allEntries.filter(
                          ({ field }) => !field?.is_ai_calculated
                        );

                        return (
                          <>
                            {/* Non-AI fields in 2 columns */}
                            {nonAIFields.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {nonAIFields.map(
                                  ({ fieldName, value, field }) => {
                                    if (!field) return null;
                                    const hasWeight = field.has_weight;
                                    const selectedOption =
                                      field.options?.options?.find(
                                        (opt: any) => opt.value === value
                                      );

                                    // For Stage 2: show 1000 or 0 based on correctness
                                    let fieldScore =
                                      selectedOption?.weight || 0;
                                    let isCorrect = false;
                                    if (activeTab === 2 && hasWeight) {
                                      isCorrect = selectedOption?.weight > 0;
                                      fieldScore = isCorrect ? 1000 : 0;
                                    }

                                    return (
                                      <div
                                        key={fieldName}
                                        className={`rounded-xl p-3 border ${
                                          hasWeight
                                            ? activeTab === 2 && isCorrect
                                              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                                              : activeTab === 2 && !isCorrect
                                              ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                                              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                                            : "bg-white border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <h5 className="text-sm font-semibold text-gray-900 flex-1">
                                            {field.label}
                                          </h5>
                                          {hasWeight && (
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ml-2 ${
                                                activeTab === 2 && isCorrect
                                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                                  : activeTab === 2 &&
                                                    !isCorrect
                                                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                                                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                              }`}
                                            >
                                              {fieldScore}
                                            </span>
                                          )}
                                        </div>
                                        <div className="bg-white/60 rounded-lg p-2">
                                          <p className="text-sm text-gray-900">
                                            {renderValue(value, field)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}

                            {/* AI fields full width */}
                            {aiFields.length > 0 && (
                              <div className="space-y-3 mt-4">
                                {aiFields.map(({ fieldName, value, field }) => {
                                  if (!field) return null;

                                  const aiEvaluation =
                                    field.question_title &&
                                    currentStageData.ai_evaluations
                                      ? currentStageData.ai_evaluations[
                                          field.question_title
                                        ]
                                      : null;

                                  return (
                                    <div
                                      key={fieldName}
                                      className="rounded-xl p-4 border-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-bold text-gray-900 mb-1">
                                            {field.label}
                                          </h5>
                                          {field.question_title && (
                                            <p className="text-sm text-gray-600">
                                              {field.question_title}
                                            </p>
                                          )}
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                                          <Award className="w-3 h-3" />
                                          AI تقييم
                                        </span>
                                      </div>

                                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 mb-3">
                                        <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                          {renderValue(value, field)}
                                        </p>
                                      </div>

                                      {renderAIEvaluation(
                                        aiEvaluation,
                                        activeTab
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}
