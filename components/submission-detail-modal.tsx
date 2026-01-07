"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
  if (!submission) return null;

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

  const renderAIEvaluation = (aiEvaluation: any) => {
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
        // Calculate total weighted score
        const totalScore = breakdownEntries.reduce(
          (sum, [_, data]: [string, any]) => {
            if (
              typeof data === "object" &&
              data !== null &&
              typeof data.result === "number"
            ) {
              return sum + data.result;
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
                        <span className="text-xs text-gray-500">
                          الوزن: {(weight * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs font-bold text-green-600">
                          النتيجة: {result.toFixed(1)}
                        </span>
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
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">تفاصيل النموذج</h2>
                  <p className="text-white/80 text-sm">
                    المرحلة {submission.stage}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">
                      المستخدم:
                    </span>
                    <span className="text-gray-900">
                      {submission.user_email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">النقاط:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                      {submission.score?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">
                      تاريخ التقديم:
                    </span>
                    <span className="text-gray-900">
                      {new Date(submission.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Form Data with Scores */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    البيانات المقدمة
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(submission.data || {})
                      .sort(([fieldNameA], [fieldNameB]) => {
                        const fieldA = formFields.find(
                          (f) => f.field_name === fieldNameA
                        );
                        const fieldB = formFields.find(
                          (f) => f.field_name === fieldNameB
                        );
                        return (
                          (fieldA?.display_order || 999) -
                          (fieldB?.display_order || 999)
                        );
                      })
                      .map(([fieldName, value]) => {
                        const field = formFields.find(
                          (f) => f.field_name === fieldName
                        );
                        const hasWeight = field?.has_weight;
                        const selectedOption = field?.options?.options?.find(
                          (opt: any) => opt.value === value
                        );
                        const fieldScore = selectedOption?.weight || 0;

                        // Get AI evaluation for this field
                        const aiEvaluation =
                          field?.question_title && submission.ai_evaluations
                            ? submission.ai_evaluations[field.question_title]
                            : null;

                        return (
                          <div
                            key={fieldName}
                            className={`${
                              hasWeight || field?.is_ai_calculated
                                ? "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200"
                                : "bg-white border-2 border-gray-200"
                            } rounded-xl p-4`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-bold text-gray-800">
                                {getFieldLabel(fieldName)}
                              </div>
                              {hasWeight && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-500 text-white">
                                  {fieldScore} / 1000
                                </span>
                              )}
                            </div>
                            <div className="text-gray-900">
                              {renderValue(value, field)}
                            </div>

                            {/* AI Evaluation Display */}
                            {renderAIEvaluation(aiEvaluation)}
                          </div>
                        );
                      })}

                    {/* Total Score */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-gray-900">
                          المجموع الكلي
                        </div>
                        <span className="inline-flex items-center px-5 py-2 rounded-full text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                          {submission.score?.toFixed(1) || "0.0"} /{" "}
                          {formFields.filter((f) => f.has_weight).length * 1000}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}
