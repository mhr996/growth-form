"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SuccessMessagePage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stage_settings")
        .select("*")
        .eq("stage", 1)
        .single();

      if (error) throw error;

      if (data) {
        setSuccessMessage(data.success_message || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({
        type: "error",
        text: "فشل تحميل الإعدادات. تأكد من تشغيل السكربت في Supabase.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from("stage_settings")
        .update({
          success_message: successMessage,
        })
        .eq("stage", 1);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "تم حفظ الإعدادات بنجاح!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ الإعدادات. حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2A3984] mx-auto mb-2" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            رسالة النجاح
          </h1>
          <p className="text-gray-600">
            قم بتخصيص الرسالة التي ستظهر للمستخدم بعد إرسال النموذج بنجاح
          </p>
        </div>

        {/* Alert Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p
              className={
                message.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Success Message Editor */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <label className="block text-sm font-semibold text-green-600 mb-3">
              نص رسالة النجاح
            </label>
            <textarea
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              placeholder="أدخل الرسالة التي ستظهر للمستخدم بعد إرسال النموذج..."
              rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              يمكنك استخدام أسطر متعددة. ستظهر الرسالة كما هي للمستخدم.
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-green-600 mb-3">
              معاينة الرسالة:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-line text-gray-700">
              {successMessage || "لا توجد رسالة بعد..."}
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            نصائح:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 mr-6 list-disc">
            <li>اجعل الرسالة واضحة ومباشرة</li>
            <li>أخبر المستخدم بالخطوات التالية</li>
            <li>ضع معلومات التواصل إذا لزم الأمر</li>
            <li>استخدم لغة إيجابية ومشجعة</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
