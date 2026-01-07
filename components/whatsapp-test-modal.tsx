"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsAppTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppTestModal({ isOpen, onClose }: WhatsAppTestModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [template, setTemplate] = useState("");
  const [param1, setParam1] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleSend = async () => {
    if (!phoneNumber || !template) {
      setResult({
        success: false,
        message: "الرجاء إدخال رقم الهاتف واسم القالب",
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          template: template,
          param_1: param1 || undefined,
          image: imageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: "تم إرسال الرسالة بنجاح!" });
        setPhoneNumber("");
        setTemplate("");
        setParam1("");
        setImageUrl("");
      } else {
        setResult({
          success: false,
          message: data.error || "فشل إرسال الرسالة",
          details: data.details,
        });
      }
    } catch (error) {
      setResult({ success: false, message: "حدث خطأ أثناء إرسال الرسالة" });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber("");
    setTemplate("");
    setParam1("");
    setImageUrl("");
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            dir="rtl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              اختبار WhatsApp API
            </h2>

            {/* Phone Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="966XXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E1538] focus:border-transparent outline-none transition-all"
                disabled={sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                أدخل الرقم بصيغة دولية (مثال: 966XXXXXXXXX)
              </p>
            </div>

            {/* Template Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم القالب (Template Name)
              </label>
              <input
                type="text"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="template_name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E1538] focus:border-transparent outline-none transition-all"
                disabled={sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                اسم القالب المعتمد في WhatsApp Business API
              </p>
            </div>

            {/* Parameter 1 Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معامل 1 (يحل محل {"{{1}}"} في القالب)
              </label>
              <input
                type="text"
                value={param1}
                onChange={(e) => setParam1(e.target.value)}
                placeholder="مثال: ماهر"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E1538] focus:border-transparent outline-none transition-all"
                disabled={sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                أدخل القيمة مباشرة (بدون أقواس)
              </p>
            </div>

            {/* Image URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الصورة (اختياري)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E1538] focus:border-transparent outline-none transition-all"
                disabled={sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                رابط الصورة في القالب
              </p>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  result.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <div className="font-semibold mb-1">{result.message}</div>
                {result.details?.error?.error_data?.details && (
                  <div className="text-sm mt-1 mb-2">
                    {result.details.error.error_data.details}
                  </div>
                )}
                {result.details && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer hover:underline">
                      تفاصيل الخطأ
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-32 bg-white/50 p-2 rounded">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !phoneNumber || !template}
              className="w-full bg-gradient-to-r from-[#8E1538] to-[#6B0F2A] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  جاري الإرسال...
                </span>
              ) : (
                "إرسال الرسالة"
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
