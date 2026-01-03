"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onAccept: () => void;
  welcomeMessage: string;
  userAgreement: string;
}

export function WelcomeModal({
  isOpen,
  onAccept,
  welcomeMessage,
  userAgreement,
}: WelcomeModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreedToTerms) return;

    setLoading(true);
    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));
    onAccept();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  مرحباً بك في Growth Plus
                </h2>
                <p className="text-white/90 text-sm">
                  يسعدنا انضمامك إلى برنامجنا
                </p>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto flex-1">
                {/* Welcome Message */}
                {welcomeMessage && (
                  <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                      {welcomeMessage}
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
                      {userAgreement || ""}
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: agreedToTerms ? 1.02 : 1 }}
                  whileTap={{ scale: agreedToTerms ? 0.98 : 1 }}
                  onClick={handleAccept}
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
                      <span>جاري التحميل...</span>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>ابدأ التسجيل</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
