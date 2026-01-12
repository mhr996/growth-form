"use client";

import { useState, useRef } from "react";
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
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("otp");
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      if (err.message.includes("Email not found")) {
        setError("عذراً، هذا البريد الإلكتروني غير مدرج في قائمة المدعوين.");
      } else {
        setError(err.message || "فشل إرسال رمز التحقق. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      // Auto-submit
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const fullOtp = otpCode || otp.join("");

    if (fullOtp.length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: fullOtp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      // Use the hashed token to verify and sign in with Supabase
      // For magic links, verifyOtp expects `token_hash` without email
      if (data.hashed_token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: "magiclink",
          token_hash: data.hashed_token,
        } as any);

        if (verifyError) {
          console.error("Verify error:", verifyError);
          // Even if verify fails, the user might already be authenticated
          // So we continue and check the session
        }
      }

      // Wait a moment for session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the session to ensure user is logged in
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error("Session error:", sessionError);
        throw new Error("Failed to establish session");
      }

      // Call onVerified to refresh the page/context
      onVerified();
    } catch (err: any) {
      if (err.message.includes("expired")) {
        setError("انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.");
      } else if (err.message.includes("Invalid")) {
        setError("رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.");
      } else {
        setError(err.message || "فشل التحقق. حاول مرة أخرى.");
      }
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
                    ? "التحقق من البريد الإلكتروني"
                    : "أدخل رمز التحقق"}
                </h2>
                <p className="text-white/90">
                  {step === "email"
                    ? "للوصول إلى النموذج، يرجى إدخال بريدك الإلكتروني"
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
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                        أدخل رمز التحقق المكون من 6 أرقام
                      </label>

                      {/* OTP Input */}
                      <div
                        style={{ direction: "ltr" }}
                        className="flex gap-2 justify-center mb-4"
                        onPaste={handlePaste}
                      >
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={loading}
                            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-[#2A3984] transition-all disabled:opacity-50"
                          />
                        ))}
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVerifyOTP()}
                      disabled={loading || otp.join("").length !== 6}
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
                      onClick={() => {
                        setStep("email");
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                      disabled={loading}
                      className="w-full text-sm text-blue-600 hover:text-blue-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      <span>تغيير البريد الإلكتروني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendOTP({ preventDefault: () => {} } as any)
                      }
                      disabled={loading}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                      إعادة إرسال الرمز
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  {step === "email"
                    ? ""
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
