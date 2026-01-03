"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Check, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onVerified: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onVerified,
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Send OTP using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setStep("otp");
    } catch (err: any) {
      setError(err.message || "فشل إرسال رمز التحقق. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      // Successfully verified and logged in
      onVerified();
    } catch (err: any) {
      setError(err.message || "رمز التحقق غير صحيح. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4"
                >
                  <Mail className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {step === "email"
                    ? "تحقق من بريدك الإلكتروني"
                    : "أدخل رمز التحقق"}
                </h2>
                <p className="text-white/90 text-sm">
                  {step === "email"
                    ? "للوصول إلى النموذج، يرجى التحقق من بريدك الإلكتروني أولاً"
                    : `تم إرسال رمز التحقق إلى ${email}`}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {step === "email" ? (
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="example@email.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-transparent transition-all"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <span>إرسال رمز التحقق</span>
                          <ArrowLeft className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رمز التحقق
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        required
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-[#2A3984] focus:border-transparent transition-all"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري التحقق...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>تحقق</span>
                          </>
                        )}
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        تغيير البريد الإلكتروني
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  {step === "email"
                    ? "سنرسل لك رمز تحقق مكون من 6 أرقام"
                    : "تحقق من بريدك الوارد أو البريد العشوائي"}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
