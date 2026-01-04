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

type Submission = {
  id: string;
  user_email: string;
  stage: number;
  data: any;
  created_at: string;
  updated_at: string;
  score?: number;
  approved?: boolean;
  ai_evaluations?: any;
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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<number | "all">("all");
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "unapproved"
  >("all");
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<
    "score" | "age" | "created_at" | "stage" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
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
          "id, field_name, label, field_type, options, has_weight, question_title, is_ai_calculated, display_order"
        )
        .order("display_order");

      if (error) throw error;
      setFormFields(data || []);
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

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.data?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.data?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === "all" || sub.stage === stageFilter;

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "approved" && sub.approved) ||
      (approvalFilter === "unapproved" && !sub.approved);

    const matchesAdvancedFilters = Object.entries(advancedFilters).every(
      ([fieldName, filterValue]) => {
        if (!filterValue || filterValue === "all") return true;
        return sub.data?.[fieldName] === filterValue;
      }
    );

    return (
      matchesSearch && matchesStage && matchesApproval && matchesAdvancedFilters
    );
  });

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "score":
        aValue = a.score || 0;
        bValue = b.score || 0;
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

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({ approved: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, approved: !currentStatus } : s))
      );
    } catch (error) {
      console.error("Error toggling approval:", error);
      alert("حدث خطأ أثناء تحديث الحالة");
    }
  };

  const bulkApprove = async (approve: boolean) => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({ approved: approve })
        .in("id", selectedIds);

      if (error) throw error;
      setSubmissions((prev) =>
        prev.map((s) =>
          selectedIds.includes(s.id) ? { ...s, approved: approve } : s
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Error bulk updating:", error);
      alert("حدث خطأ أثناء التحديث الجماعي");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedSubmissions.map((s) => s.id));
    }
  };

  const handleSort = (field: "score" | "age" | "created_at" | "stage") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: "score" | "age" | "created_at" | "stage") => {
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
    setApprovalFilter("all");
    setAdvancedFilters({});
    setSortField(null);
    setSortDirection("desc");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    stageFilter !== "all" ||
    approvalFilter !== "all" ||
    Object.keys(advancedFilters).some(
      (key) => advancedFilters[key] !== "all" && advancedFilters[key] !== ""
    );

  const approvedCount = submissions.filter((s) => s.approved).length;
  const unapprovedCount = submissions.length - approvedCount;

  const exportToExcel = () => {
    const exportData = sortedSubmissions.map((sub) => ({
      "User Email": sub.user_email,
      Stage: sub.stage,
      Score: sub.score || 0,
      Approved: sub.approved ? "Yes" : "No",
      "Created At": new Date(sub.created_at).toLocaleString("en-US"),
      ...sub.data,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `submissions-${new Date().toISOString()}.xlsx`);
  };

  const getFieldLabel = (fieldName: string) => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.label || fieldName;
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

  const selectRadioFields = formFields.filter(
    (f) =>
      (f.field_type === "select" || f.field_type === "radio") &&
      f.field_name !== "city"
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
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                موافق عليها: {approvedCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <XCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                غير موافق عليها: {unapprovedCount}
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
                  onClick={() => bulkApprove(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  موافقة جماعية
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bulkApprove(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold text-sm hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  إلغاء الموافقة
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
                ]}
                onChange={(value) =>
                  setStageFilter(value === "all" ? "all" : parseInt(value))
                }
              />
            </div>

            {/* Approval Filter */}
            <div className="w-full sm:w-48">
              <CustomFilterDropdown
                label="الحالة"
                value={approvalFilter}
                options={[
                  { value: "all", label: `الكل (${submissions.length})` },
                  { value: "approved", label: `موافق (${approvedCount})` },
                  {
                    value: "unapproved",
                    label: `غير موافق (${unapprovedCount})`,
                  },
                ]}
                onChange={(value) =>
                  setApprovalFilter(value as "all" | "approved" | "unapproved")
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white">
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
                    className="px-6 py-4 text-right text-sm font-bold cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      النقاط
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
                    الحالة
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
                      {submission.data?.age || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600" dir="ltr">
                      {submission.data?.phoneNumber || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {submission.score?.toFixed(1) || "0.0"}
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          toggleApproval(
                            submission.id,
                            submission.approved || false
                          )
                        }
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          submission.approved
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {submission.approved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            موافق
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 ml-1" />
                            غير موافق
                          </>
                        )}
                      </motion.button>
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
      <AnimatePresence>
        {selectedSubmission && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
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
                      <h2 className="text-2xl font-bold mb-1">
                        تفاصيل النموذج
                      </h2>
                      <p className="text-white/80 text-sm">
                        المرحلة {selectedSubmission.stage}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSubmission(null)}
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
                          {selectedSubmission.user_email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">
                          النقاط:
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                          {selectedSubmission.score?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">
                          تاريخ التقديم:
                        </span>
                        <span className="text-gray-900">
                          {new Date(
                            selectedSubmission.created_at
                          ).toLocaleString("en-US", {
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
                        {Object.entries(selectedSubmission.data || {})
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
                            const selectedOption =
                              field?.options?.options?.find(
                                (opt: any) => opt.value === value
                              );
                            const fieldScore = selectedOption?.weight || 0;

                            // Get AI evaluation for this field
                            const aiEvaluation =
                              field?.question_title &&
                              selectedSubmission.ai_evaluations
                                ? selectedSubmission.ai_evaluations[
                                    field.question_title
                                  ]
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
                                      {fieldScore} / 100
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-900">
                                  {typeof value === "object"
                                    ? JSON.stringify(value, null, 2)
                                    : selectedOption?.label || String(value)}
                                </div>

                                {/* AI Evaluation Display */}
                                {aiEvaluation && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        تقييم الذكاء الاصطناعي
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                          aiEvaluation.evaluation?.score >= 70
                                            ? "bg-green-500 text-white"
                                            : aiEvaluation.evaluation?.score >=
                                              40
                                            ? "bg-yellow-500 text-white"
                                            : "bg-red-500 text-white"
                                        }`}
                                      >
                                        {aiEvaluation.evaluation?.score || 0} /
                                        100
                                      </span>
                                    </div>
                                    <p className="text-xs text-blue-800 leading-relaxed">
                                      {aiEvaluation.evaluation?.explanation ||
                                        "لا يوجد تفسير"}
                                    </p>
                                    {aiEvaluation.evaluation?.error && (
                                      <p className="text-xs text-red-600 mt-2">
                                        ⚠️ حدث خطأ في التقييم
                                      </p>
                                    )}
                                  </div>
                                )}
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
                              {selectedSubmission.score?.toFixed(1) || "0.0"} /{" "}
                              {formFields.filter((f) => f.has_weight).length *
                                100}
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
        )}
      </AnimatePresence>
    </div>
  );
}
