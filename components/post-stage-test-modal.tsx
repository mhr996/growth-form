"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PostStageTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: number;
}

export function PostStageTestModal({
  isOpen,
  onClose,
  stage,
}: PostStageTestModalProps) {
  const [testName, setTestName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testType, setTestType] = useState<"nominated" | "exclude">(
    "nominated"
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const supabase = createClient();

  const handleClose = () => {
    if (!sending) {
      setTestName("");
      setTestEmail("");
      setTestPhone("");
      setTestType("nominated");
      setResult(null);
      onClose();
    }
  };

  const handleSendTest = async () => {
    if (!testName.trim() || !testEmail.trim()) {
      setResult({
        type: "error",
        message: "الرجاء إدخال الاسم والبريد الإلكتروني على الأقل",
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Fetch current stage settings
      const { data: settings, error: settingsError } = await supabase
        .from("stage_settings")
        .select("*")
        .eq("stage", stage)
        .single();

      if (settingsError) throw settingsError;

      if (!settings) {
        throw new Error("لم يتم العثور على إعدادات المرحلة");
      }

      // Determine which content to use based on test type
      const emailSubject =
        testType === "nominated"
          ? settings.passed_email_subject
          : settings.failed_email_subject;
      const emailContent =
        testType === "nominated"
          ? settings.passed_email_content
          : settings.failed_email_content;
      const whatsappTemplate =
        testType === "nominated"
          ? settings.passed_whatsapp_template
          : settings.failed_whatsapp_template;
      const whatsappImage =
        testType === "nominated"
          ? settings.passed_whatsapp_image
          : settings.failed_whatsapp_image;

      // Prepare test recipient
      const testRecipient = {
        user_name: testName,
        user_email: testEmail,
        user_phone: testPhone || null,
        filtering_decision: testType,
      };

      // Call the end-stage API with just this one test user
      const response = await fetch("/api/end-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          settings: {
            passedEmailSubject: emailSubject,
            passedEmailContent: emailContent,
            failedEmailSubject: emailSubject,
            failedEmailContent: emailContent,
            passedWhatsappTemplate: whatsappTemplate,
            passedWhatsappImage: whatsappImage,
            failedWhatsappTemplate: whatsappTemplate,
            failedWhatsappImage: whatsappImage,
          },
          testMode: true,
          testRecipients: [testRecipient],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل إرسال رسائل الاختبار");
      }

      setResult({
        type: "success",
        message: `تم الإرسال بنجاح! إيميلات: ${result.totalEmailsSent}، واتساب: ${result.totalWhatsappsSent}`,
      });
    } catch (error: any) {
      console.error("Error sending test:", error);
      setResult({
        type: "error",
        message: `فشل الإرسال: ${error.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  اختبار رسائل المرحلة {stage}
                </h2>
                <p className="text-sm text-white/80">
                  اختبر إرسال البريد الإلكتروني والواتساب
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={sending}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Test Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                نوع الاختبار
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTestType("nominated")}
                  disabled={sending}
                  className={`
                    p-4 rounded-xl font-bold transition-all disabled:opacity-50
                    ${
                      testType === "nominated"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ناجح (Nominated)</span>
                  </div>
                </button>
                <button
                  onClick={() => setTestType("exclude")}
                  disabled={sending}
                  className={`
                    p-4 rounded-xl font-bold transition-all disabled:opacity-50
                    ${
                      testType === "exclude"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span>راسب (Exclude)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Test User Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المستخدم للاختبار *
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="مثال: محمد أحمد"
              />
            </div>

            {/* Test Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                البريد الإلكتروني للاختبار *
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="test@example.com"
                dir="ltr"
              />
            </div>

            {/* Test Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رقم الهاتف للاختبار (اختياري)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم إرسال رسالة واتساب فقط إذا تم إدخال رقم الهاتف
              </p>
            </div>

            {/* Result Message */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  p-4 rounded-xl flex items-start gap-3
                  ${
                    result.type === "success"
                      ? "bg-green-50 text-green-700 border-2 border-green-200"
                      : "bg-red-50 text-red-700 border-2 border-red-200"
                  }
                `}
              >
                {result.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{result.message}</p>
                  {result.type === "success" && (
                    <p className="text-xs mt-1 opacity-80">
                      تحقق من البريد الإلكتروني والواتساب للمستخدم
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 text-sm text-blue-700">
                  <p className="font-semibold mb-1">ملاحظة:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• سيتم استخدام المحتوى المحفوظ في إعدادات المرحلة</li>
                    <li>• اختر "ناجح" لاختبار رسائل المقبولين</li>
                    <li>• اختر "راسب" لاختبار رسائل المرفوضين</li>
                    <li>• سيتم استبدال {"{{name}}"} باسم المستخدم المدخل</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t-2 border-gray-100 flex gap-3">
            <button
              onClick={handleClose}
              disabled={sending}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              onClick={handleSendTest}
              disabled={sending || !testName.trim() || !testEmail.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>إرسال الاختبار</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
