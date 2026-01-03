"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  User,
  Clock,
} from "lucide-react";

type Submission = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  age: number;
  gender: string;
  phone_number: string;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteSubmission = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النموذج؟")) return;

    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              النماذج المقدمة
            </h1>
            <p className="text-gray-600">إجمالي {submissions.length} نموذج</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
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
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
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
        <div className="grid gap-4">
          {filteredSubmissions.map((submission, index) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] flex items-center justify-center text-white font-bold text-lg">
                      {submission.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {submission.full_name}
                      </h3>
                      <p className="text-sm text-gray-600" dir="ltr">
                        {submission.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {submission.gender === "male" ? "ذكر" : "أنثى"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{submission.age} سنة</span>
                    </div>
                    <div
                      className="flex items-center gap-2 text-gray-600"
                      dir="ltr"
                    >
                      <span>📱</span>
                      <span>{submission.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(submission.created_at).toLocaleDateString(
                          "ar-SA"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteSubmission(submission.id)}
                    className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
