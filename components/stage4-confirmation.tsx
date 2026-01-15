"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 1, label: "المعلومات الأساسية والموائمة" },
  { id: 2, label: "الجدارات الأساسية" },
  { id: 3, label: "التحدي الريادي" },
  { id: 4, label: "التقييم السايكومتري" },
];

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
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-[#2A3984] via-[#2A3984] to-[#1e2a5c] px-8 py-6 sm:py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
            <div className="relative">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center mb-2"
              >
                نموذج التسجيل في برنامج Growth Plus
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/90 text-center text-sm"
              >
                يرجى قراءة المعلومات التالية بعناية
              </motion.p>
            </div>
          </div>

          {/* Stepper */}
          <div className="px-4 sm:px-6 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between relative max-w-4xl mx-auto">
              {/* Progress Line */}
              <div className="absolute right-0 top-5 sm:top-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>

              {/* Steps */}
              {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < 4;
                const isCurrent = stepNumber === 4;

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-1 relative z-10 flex-1"
                  >
                    <motion.div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base
                        transition-all duration-300 shadow-lg
                        ${
                          isCompleted
                            ? "bg-gradient-to-br from-[#2A3984] to-[#1e2a5c] text-white"
                            : ""
                        }
                        ${
                          isCurrent
                            ? "bg-white text-[#2A3984] ring-4 ring-[#2A3984]/20 scale-110"
                            : ""
                        }
                        ${
                          !isCompleted && !isCurrent
                            ? "bg-gray-100 text-gray-400"
                            : ""
                        }
                      `}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                      }}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        stepNumber
                      )}
                    </motion.div>
                    <span
                      className={`
                        text-[10px] sm:text-xs font-medium text-center mt-3 px-1 leading-tight
                        ${
                          isCompleted || isCurrent
                            ? "text-[#2A3984]"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
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
                  className="mt-1 w-5 h-5 text-[#2A3984] rounded focus:ring-2 focus:ring-[#2A3984] cursor-pointer shrink-0"
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
