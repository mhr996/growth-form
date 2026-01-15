"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Stage4ConfirmationProps {
  userEmail: string;
  stageSettings: {
    welcome_message: string;
    user_agreement: string;
    success_message: string;
  };
}

export function Stage4Confirmation({
  userEmail,
  stageSettings,
}: Stage4ConfirmationProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!agreedToTerms) return;

    setLoading(true);

    try {
      // Update user's stage to 5 in form_submissions
      const { error } = await supabase
        .from("form_submissions")
        .update({ stage: 5, updated_at: new Date().toISOString() })
        .eq("user_email", userEmail);

      if (error) throw error;

      // Show success message
      setShowSuccess(true);
    } catch (error) {
      console.error("Error updating stage:", error);
      alert("حدث خطأ أثناء إرسال الموافقة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-xl">
              <Image
                src="/logo.webp"
                alt="Growth Plus"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-6 px-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-3"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white"></h2>
            </div>

            {/* Success Content */}
            <div className="p-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {stageSettings.success_message}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-xl">
            <Image
              src="/logo.webp"
              alt="Growth Plus"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] py-5 px-6 text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              المرحلة الرابعة
            </h2>
            <p className="text-white/90 text-sm">
              يرجى قراءة المعلومات التالية بعناية
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Welcome Message */}
            {stageSettings.welcome_message && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {stageSettings.welcome_message}
                </div>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div className="bg-white border-2 border-[#2A3984]/20 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-[#2A3984] rounded focus:ring-2 focus:ring-[#2A3984] cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-red-600 group-hover:text-red-700 transition-colors leading-relaxed">
                  {stageSettings.user_agreement || ""}
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <motion.button
              whileHover={{ scale: agreedToTerms ? 1.02 : 1 }}
              whileTap={{ scale: agreedToTerms ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={!agreedToTerms || loading}
              className={`
                w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all
                ${
                  agreedToTerms
                    ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <>
                  <span>جاري الإرسال...</span>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : (
                <>
                  <span>تأكيد الموافقة</span>
                  <Check className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
