"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Stage1SettingsPage() {
  const [passedEmailContent, setPassedEmailContent] = useState("");
  const [failedEmailContent, setFailedEmailContent] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
      const { data, error } = await supabase
        .from("stage_settings")
        .select("*")
        .eq("stage", 1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPassedEmailContent(data.passed_email_content || "");
        setFailedEmailContent(data.failed_email_content || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("stage_settings")
        .select("id")
        .eq("stage", 1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("stage_settings")
          .update({
            passed_email_content: passedEmailContent,
            failed_email_content: failedEmailContent,
            updated_at: new Date().toISOString(),
          })
          .eq("stage", 1);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("stage_settings").insert({
          stage: 1,
          passed_email_content: passedEmailContent,
          failed_email_content: failedEmailContent,
        });

        if (error) throw error;
      }

      setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "فشل حفظ الإعدادات. حاول مرة أخرى." });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEndStage = () => {
    setShowConfirmModal(false);
    setMessage({ type: "success", text: "سيتم تفعيل هذه الميزة قريباً" });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          إعدادات المرحلة الأولى
        </h1>
        <p className="text-gray-600">
          قم بإعداد محتوى البريد الإلكتروني وإنهاء المرحلة
        </p>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              mb-6 p-4 rounded-xl flex items-center gap-3
              ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }
            `}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Passed Users Email */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            محتوى البريد الإلكتروني للمتقدمين الناجحين
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            هذا البريد سيتم إرساله للمستخدمين الذين اجتازوا المرحلة بنجاح
          </p>
          <textarea
            value={passedEmailContent}
            onChange={(e) => setPassedEmailContent(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all resize-none"
            placeholder="اكتب محتوى البريد الإلكتروني هنا..."
          />
        </div>

        {/* Failed Users Email */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            محتوى البريد الإلكتروني للمتقدمين غير الناجحين
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            هذا البريد سيتم إرساله للمستخدمين الذين لم يجتازوا المرحلة
          </p>
          <textarea
            value={failedEmailContent}
            onChange={(e) => setFailedEmailContent(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all resize-none"
            placeholder="اكتب محتوى البريد الإلكتروني هنا..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mt-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-1">
                منطقة الخطر
              </h2>
              <p className="text-sm text-red-700">
                إجراء إنهاء المرحلة لا يمكن التراجع عنه
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-2">
              ماذا سيحدث عند إنهاء المرحلة؟
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>
                  سيتم منع المستخدمين من تقديم نماذج جديدة لهذه المرحلة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>
                  سيتم إرسال رسائل بريد إلكتروني للمستخدمين الناجحين وغير
                  الناجحين
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>لا يمكن التراجع عن هذا الإجراء</span>
              </li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmModal(true)}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>إنهاء المرحلة الأولى</span>
          </motion.button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      تأكيد إنهاء المرحلة
                    </h3>
                    <p className="text-gray-600 text-sm">
                      هل أنت متأكد من رغبتك في إنهاء المرحلة الأولى؟
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800 font-semibold mb-3">
                    ⚠️ هذا الإجراء لا يمكن التراجع عنه!
                  </p>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li>• سيتم منع تقديم نماذج جديدة</li>
                    <li>• سيتم إرسال رسائل بريد إلكتروني تلقائياً</li>
                    <li>• لن تتمكن من إعادة فتح المرحلة</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleEndStage}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    تأكيد الإنهاء
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
