"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  X,
  Filter,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { CustomFilterDropdown } from "@/components/custom-filter-dropdown";
import { SubmissionDetailModal } from "@/components/submission-detail-modal";

// Safely parse JSON strings (returns null on failure)
function safeParseJSON(str: string | null | undefined): any {
  if (!str || typeof str !== "string") return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Normalize options shape to an array of { label, value }
function getOptionsArray(opts: any): Array<{ label: string; value: any }> {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts as any[];
  if (Array.isArray(opts?.options)) return opts.options as any[];
  return [];
}

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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<number | "all">("all");
  const [channelFilter, setChannelFilter] = useState<string | "all">("all");
  const [filteringDecisionFilter, setFilteringDecisionFilter] = useState<
    "all" | "auto" | "exclude" | "nominated"
  >("all");
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<
    | "score"
    | "age"
    | "created_at"
    | "stage"
    | "stage1_score"
    | "stage2_score"
    | "stage3_score"
    | null
  >("score"); // Default to score
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [rowsPerPage, setRowsPerPage] = useState<number>(1000); // Default to 1000
  const supabase = createClient();

  useEffect(() => {
    fetchFormFields();
    fetchSubmissions();
  }, []);

  const fetchFormFields = async () => {
    try {
      const { data, error } = await supabase
        .from("form_fields")
        .select(
          "id, field_name, label, field_type, options, has_weight, question_title, is_ai_calculated, display_order, stage, weight"
        )
        .order("display_order");

      if (error) throw error;
      const parsed = (data || []).map((f: any) => ({
        ...f,
        options:
          typeof f.options === "string" ? safeParseJSON(f.options) : f.options,
      }));
      setFormFields(parsed);
    } catch (error) {
      console.error("Error fetching form fields:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate score dynamically from field weights
  const calculateScore = (submission: Submission): number => {
    // Calculate total score across all stages
    const stage1Score = calculateStageScore(submission, 1);
    const stage2Score = calculateStageScore(submission, 2);
    const stage3Score = calculateStageScore(submission, 3);

    return stage1Score + stage2Score + stage3Score;
  };

  // Calculate score for a specific stage
  const calculateStageScore = (
    submission: Submission,
    stage: number
  ): number => {
    let stageScore = 0;

    // Get data from stage-specific column
    // Stage 1: data, Stage 2: data_stage_2, Stage 3: data_stage_3
    let stageData: any = {};
    let stageAiEvaluations: any = {};

    if (stage === 1) {
      stageData = submission.data || {};
      stageAiEvaluations = submission.ai_evaluations || {};
    } else if (stage === 2) {
      stageData = (submission as any).data_stage_2 || {};
      stageAiEvaluations = (submission as any).ai_evaluations_stage_2 || {};
    } else if (stage === 3) {
      stageData = (submission as any).data_stage_3 || {};
      stageAiEvaluations = (submission as any).ai_evaluations_stage_3 || {};
    }

    // Calculate scores for regular (non-AI) fields
    formFields.forEach((field) => {
      // Only calculate for fields in this stage
      if (field.stage !== stage) return;

      // Skip AI fields - we'll calculate them separately
      if (field.is_ai_calculated) return;

      if (field.has_weight && stageData[field.field_name] !== undefined) {
        const selectedOption = field.options?.options?.find(
          (opt: any) => opt.value === stageData[field.field_name]
        );
        if (selectedOption?.weight !== undefined) {
          if (stage === 2) {
            // For Stage 2: 1000 points if weight > 0 (correct), 0 if weight = 0 (wrong)
            stageScore += selectedOption.weight > 0 ? 1000 : 0;
          } else {
            // For other stages, use weight as-is
            stageScore += selectedOption.weight;
          }
        }
      }
    });

    // Add AI evaluation scores separately (once per AI question, not per field)
    if (stageAiEvaluations && Object.keys(stageAiEvaluations).length > 0) {
      Object.values(stageAiEvaluations).forEach((aiEval: any) => {
        if (aiEval?.evaluation) {
          const evaluation = aiEval.evaluation;
          if (typeof evaluation === "object" && !Array.isArray(evaluation)) {
            const breakdownEntries = Object.entries(evaluation).filter(
              ([key]) => !["error", "total"].includes(key)
            );
            const aiScore = breakdownEntries.reduce(
              (sum, [_, data]: [string, any]) => {
                if (typeof data === "object" && data !== null) {
                  // For Stage 3: use result instead of score
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
            stageScore += aiScore;
          }
        }
      });
    }

    return stageScore;
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.data?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.data?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === "all" || sub.stage === stageFilter;

    const matchesChannel =
      channelFilter === "all" || sub.channel === channelFilter;

    const matchesFilteringDecision =
      filteringDecisionFilter === "all" ||
      (sub.filtering_decision || "auto") === filteringDecisionFilter;

    const matchesAdvancedFilters = Object.entries(advancedFilters).every(
      ([fieldName, filterValue]) => {
        if (!filterValue || filterValue === "all") return true;
        return sub.data?.[fieldName] === filterValue;
      }
    );

    return (
      matchesSearch &&
      matchesStage &&
      matchesChannel &&
      matchesFilteringDecision &&
      matchesAdvancedFilters
    );
  });

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "score":
        aValue = calculateScore(a);
        bValue = calculateScore(b);
        break;
      case "stage1_score":
        aValue = calculateStageScore(a, 1);
        bValue = calculateStageScore(b, 1);
        break;
      case "stage2_score":
        aValue = calculateStageScore(a, 2);
        bValue = calculateStageScore(b, 2);
        break;
      case "stage3_score":
        aValue = calculateStageScore(a, 3);
        bValue = calculateStageScore(b, 3);
        break;
      case "age":
        aValue = parseInt(a.data?.age) || 0;
        bValue = parseInt(b.data?.age) || 0;
        break;
      case "created_at":
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case "stage":
        aValue = a.stage;
        bValue = b.stage;
        break;
      default:
        return 0;
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Limit displayed rows
  const displayedSubmissions = sortedSubmissions.slice(0, rowsPerPage);

  const deleteSubmission = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النموذج؟")) return;

    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const bulkUpdateFilteringDecision = async (
    decision: "auto" | "exclude" | "nominated"
  ) => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({ filtering_decision: decision })
        .in("id", selectedIds);

      if (error) throw error;
      setSubmissions((prev) =>
        prev.map((s) =>
          selectedIds.includes(s.id)
            ? { ...s, filtering_decision: decision }
            : s
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Error bulk updating:", error);
      alert("حدث خطأ أثناء التحديث الجماعي");
    }
  };

  const updateFilteringDecision = async (
    id: string,
    decision: "auto" | "exclude" | "nominated"
  ) => {
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({ filtering_decision: decision })
        .eq("id", id);

      if (error) throw error;
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, filtering_decision: decision } : s
        )
      );
    } catch (error) {
      console.error("Error updating filtering decision:", error);
      alert("حدث خطأ أثناء تحديث قرار التصفية");
    }
  };

  const getFilteringDecisionLabel = (decision?: string) => {
    switch (decision) {
      case "auto":
        return "آلي";
      case "exclude":
        return "استبعاد";
      case "nominated":
        return "مرشح";
      default:
        return "آلي";
    }
  };

  const getFilteringDecisionColor = (decision?: string) => {
    switch (decision) {
      case "auto":
        return "bg-gray-100 text-gray-700";
      case "exclude":
        return "bg-red-100 text-red-700";
      case "nominated":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedSubmissions.map((s) => s.id));
    }
  };

  const handleSort = (
    field:
      | "score"
      | "age"
      | "created_at"
      | "stage"
      | "stage1_score"
      | "stage2_score"
      | "stage3_score"
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (
    field:
      | "score"
      | "age"
      | "created_at"
      | "stage"
      | "stage1_score"
      | "stage2_score"
      | "stage3_score"
  ) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStageFilter("all");
    setChannelFilter("all");
    setFilteringDecisionFilter("all");
    setAdvancedFilters({});
    setSortField("score");
    setSortDirection("desc");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    stageFilter !== "all" ||
    channelFilter !== "all" ||
    filteringDecisionFilter !== "all" ||
    Object.keys(advancedFilters).some(
      (key) => advancedFilters[key] !== "all" && advancedFilters[key] !== ""
    );

  const autoCount = submissions.filter(
    (s) => (s.filtering_decision || "auto") === "auto"
  ).length;
  const excludeCount = submissions.filter(
    (s) => s.filtering_decision === "exclude"
  ).length;
  const nominatedCount = submissions.filter(
    (s) => s.filtering_decision === "nominated"
  ).length;

  const exportToExcel = () => {
    const exportData = sortedSubmissions.map((sub) => {
      const row: Record<string, any> = {
        "البريد الإلكتروني": sub.user_email,
        المرحلة: `المرحلة ${sub.stage}`,
        الدرجة: sub.score || 0,
        "قرار التصفية": getFilteringDecisionLabel(sub.filtering_decision),
        "تاريخ التقديم": new Date(sub.created_at).toLocaleString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Combine all stage data
      const allData = {
        ...(sub.data || {}),
        ...((sub as any).data_stage_2 || {}),
        ...((sub as any).data_stage_3 || {}),
      };

      // Parse data if it's a string
      const submissionData =
        typeof allData === "string" ? JSON.parse(allData) : allData;

      // Add form fields with Arabic labels
      Object.keys(submissionData || {}).forEach((fieldName) => {
        const fieldValue = submissionData[fieldName];
        const field = formFields.find((f) => f.field_name === fieldName);
        const arabicLabel = field?.label || fieldName;

        // Handle different field types
        if (
          field &&
          (field.field_type === "dropdown" ||
            field.field_type === "select" ||
            field.field_type === "radio")
        ) {
          // Find the option label in Arabic
          const optionsList = getOptionsArray(field.options);
          const option = optionsList.find(
            (opt: any) => String(opt.value) === String(fieldValue)
          );
          row[arabicLabel] = option?.label || fieldValue || "";
        } else if (field && field.field_type === "checkbox") {
          // Handle checkbox values
          if (Array.isArray(fieldValue)) {
            const optionsList = getOptionsArray(field.options);
            const selectedOptions = fieldValue.map((val: string) => {
              const option = optionsList.find(
                (opt: any) => String(opt.value) === String(val)
              );
              return option?.label || val;
            });
            row[arabicLabel] = selectedOptions.join("، ");
          } else {
            row[arabicLabel] =
              fieldValue === true
                ? "نعم"
                : fieldValue === false
                ? "لا"
                : fieldValue || "";
          }
        } else {
          row[arabicLabel] = fieldValue || "";
        }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبات");

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `submissions-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const getFilterOptions = (field: FormField) => {
    const options = field.options?.options || [];

    // Count submissions for each option
    const optionsWithCounts = options.map((opt: any) => {
      const count = submissions.filter(
        (sub) => sub.data?.[field.field_name] === opt.value
      ).length;
      return {
        value: opt.value,
        label: `${opt.label} (${count})`,
      };
    });

    const allCount = submissions.length;

    // Return all options directly from database
    return [
      { value: "all", label: `الكل (${allCount})` },
      ...optionsWithCounts,
    ];
  };

  const allowedFilterFields = [
    "age",
    "gender",
    "employment_status",
    "education_level",
    "experience_years",
  ];

  const selectRadioFields = formFields.filter(
    (f) =>
      (f.field_type === "select" || f.field_type === "radio") &&
      allowedFilterFields.includes(f.field_name)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A3984] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                النماذج المقدمة
              </h1>
              <p className="text-gray-600">
                عرض {displayedSubmissions.length} من أصل{" "}
                {sortedSubmissions.length} نموذج
              </p>
            </div>

            <div className="flex gap-2">
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border-2 border-red-200"
                >
                  <X className="w-5 h-5" />
                  مسح الفلاتر
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchSubmissions}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToExcel}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                تصدير Excel
              </motion.button>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm font-semibold text-gray-700">
                آلي: {autoCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-semibold text-red-700">
                استبعاد: {excludeCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-semibold text-green-700">
                مرشح: {nominatedCount}
              </span>
            </div>

            {/* Rows per page controller */}
            <div className="flex items-center gap-2 mr-auto">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                عدد الصفوف:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={rowsPerPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value > 0) setRowsPerPage(value);
                  }}
                  className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 
                    focus:border-[#2A3984] focus:ring-2 focus:ring-[#2A3984]/10
                    transition-all text-sm font-semibold text-gray-900"
                />
                <div className="flex gap-1">
                  {[10, 25, 50, 100, 200].map((count) => (
                    <motion.button
                      key={count}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRowsPerPage(count)}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                        rowsPerPage === count
                          ? "bg-[#2A3984] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {count}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRowsPerPage(sortedSubmissions.length)}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                      rowsPerPage === sortedSubmissions.length
                        ? "bg-[#2A3984] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    الكل
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
            >
              <span className="text-sm font-semibold text-blue-900">
                {selectedIds.length} محدد
              </span>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bulkUpdateFilteringDecision("nominated")}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  مرشح
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bulkUpdateFilteringDecision("exclude")}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  استبعاد
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bulkUpdateFilteringDecision("auto")}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold text-sm hover:bg-gray-600 transition-colors"
                >
                  آلي
                </motion.button>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-gray-200 
                  focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10
                  transition-all duration-200"
              />
            </div>

            {/* Stage Filter */}
            <div className="w-full sm:w-48">
              <CustomFilterDropdown
                label="المرحلة"
                value={stageFilter.toString()}
                options={[
                  { value: "all", label: `الكل (${submissions.length})` },
                  {
                    value: "1",
                    label: `المرحلة 1 (${
                      submissions.filter((s) => s.stage === 1).length
                    })`,
                  },
                  {
                    value: "2",
                    label: `المرحلة 2 (${
                      submissions.filter((s) => s.stage === 2).length
                    })`,
                  },
                  {
                    value: "3",
                    label: `المرحلة 3 (${
                      submissions.filter((s) => s.stage === 3).length
                    })`,
                  },
                  {
                    value: "4",
                    label: `المرحلة 4 (${
                      submissions.filter((s) => s.stage === 4).length
                    })`,
                  },
                  {
                    value: "5",
                    label: `المرحلة 5 (${
                      submissions.filter((s) => s.stage === 5).length
                    })`,
                  },
                ]}
                onChange={(value) =>
                  setStageFilter(value === "all" ? "all" : parseInt(value))
                }
              />
            </div>

            {/* Channel Filter */}
            <div className="w-full sm:w-48">
              <CustomFilterDropdown
                label="القناة"
                value={channelFilter}
                options={[
                  { value: "all", label: `الكل (${submissions.length})` },
                  ...Array.from(
                    new Set(submissions.map((s) => s.channel).filter(Boolean))
                  )
                    .sort()
                    .map((channel) => ({
                      value: channel as string,
                      label: `${channel} (${
                        submissions.filter((s) => s.channel === channel).length
                      })`,
                    })),
                ]}
                onChange={(value) => setChannelFilter(value)}
              />
            </div>

            {/* Filtering Decision Filter */}
            <div className="w-full sm:w-48">
              <CustomFilterDropdown
                label="قرار التصفية"
                value={filteringDecisionFilter}
                options={[
                  { value: "all", label: `الكل (${submissions.length})` },
                  { value: "auto", label: `آلي (${autoCount})` },
                  { value: "exclude", label: `استبعاد (${excludeCount})` },
                  { value: "nominated", label: `مرشح (${nominatedCount})` },
                ]}
                onChange={(value) =>
                  setFilteringDecisionFilter(
                    value as "all" | "auto" | "exclude" | "nominated"
                  )
                }
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectRadioFields.map((field) => (
              <CustomFilterDropdown
                key={field.field_name}
                label={field.label}
                value={advancedFilters[field.field_name] || "all"}
                options={getFilterOptions(field)}
                onChange={(value) =>
                  setAdvancedFilters({
                    ...advancedFilters,
                    [field.field_name]: value,
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      {sortedSubmissions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد نماذج
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "لم يتم العثور على نتائج للبحث"
              : "لم يتم تقديم أي نماذج بعد"}
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-[1200px] 2xl:max-w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === displayedSubmissions.length &&
                        displayedSubmissions.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 checked:bg-white checked:text-[#2A3984] focus:ring-2 focus:ring-white/30 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    الاسم
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    البريد الإلكتروني
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("stage")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      المرحلة
                      {getSortIcon("stage")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    الجنس
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    القناة
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("age")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      العمر
                      {getSortIcon("age")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold">
                    رقم الجوال
                  </th>
                  <th
                    className="px-4 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("stage1_score")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      المرحلة 1{getSortIcon("stage1_score")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("stage2_score")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      المرحلة 2{getSortIcon("stage2_score")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("stage3_score")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      المرحلة 3{getSortIcon("stage3_score")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      المجموع
                      {getSortIcon("score")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      تاريخ التقديم
                      {getSortIcon("created_at")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    قرار التصفية
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedSubmissions.map((submission, index) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(submission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, submission.id]);
                          } else {
                            setSelectedIds(
                              selectedIds.filter((id) => id !== submission.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#2A3984] focus:ring-2 focus:ring-[#2A3984] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {submission.data?.fullName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600" dir="ltr">
                      {submission.user_email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          submission.stage === 1
                            ? "bg-blue-100 text-blue-700"
                            : submission.stage === 2
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {submission.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.data?.gender === "male"
                        ? "ذكر"
                        : submission.data?.gender === "female"
                        ? "أنثى"
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.channel || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.data?.age || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600" dir="ltr">
                      {submission.data?.phoneNumber || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {calculateStageScore(submission, 1).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        {calculateStageScore(submission, 2).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {calculateStageScore(submission, 3).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {calculateScore(submission).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative group inline-block">
                        <button
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:shadow-md ${getFilteringDecisionColor(
                            submission.filtering_decision
                          )}`}
                        >
                          {getFilteringDecisionLabel(
                            submission.filtering_decision
                          )}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() =>
                              updateFilteringDecision(submission.id, "auto")
                            }
                            className="w-full text-right px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 first:rounded-t-lg transition-colors"
                          >
                            آلي
                          </button>
                          <button
                            onClick={() =>
                              updateFilteringDecision(submission.id, "exclude")
                            }
                            className="w-full text-right px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                          >
                            استبعاد
                          </button>
                          <button
                            onClick={() =>
                              updateFilteringDecision(
                                submission.id,
                                "nominated"
                              )
                            }
                            className="w-full text-right px-4 py-2 text-xs font-medium text-green-700 hover:bg-green-50 last:rounded-b-lg transition-colors"
                          >
                            مرشح
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedSubmission(submission)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteSubmission(submission.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        formFields={formFields}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}
