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
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Trim the email
      const trimmedEmail = email.trim();

      // First, check if the email exists in form_submissions table (returning user)
      const { data: submission, error: submissionError } = await supabase
        .from("form_submissions")
        .select("user_email")
        .eq("user_email", trimmedEmail)
        .maybeSingle();

      if (submissionError && submissionError.code !== "PGRST116") {
        console.error("Submission check error:", submissionError);
        setError("حدث خطأ أثناء التحقق من البريد الإلكتروني.");
        setLoading(false);
        return;
      }

      // If user exists in submissions, send login email directly
      if (submission) {
        const { error } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) throw error;
        setStep("sent");
        setLoading(false);
        return;
      }

      // If not in submissions, check invitees table (new user)
      const { data: invitees, error: inviteeError } = await supabase
        .from("invitees")
        .select("email");

      if (inviteeError) {
        console.error("Invitee check error:", inviteeError);
        setError("حدث خطأ أثناء التحقق من البريد الإلكتروني.");
        setLoading(false);
        return;
      }

      // Check if the email exists in invitees (case-insensitive)
      const emailExists = invitees?.some(
        (inv) => inv.email?.toLowerCase().trim() === trimmedEmail.toLowerCase()
      );

      if (!emailExists) {
        setError("عذراً، هذا البريد الإلكتروني غير مدرج في قائمة المدعوين.");
        setLoading(false);
        return;
      }

      // If email is in invitees table, send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      setStep("sent");
    } catch (err: any) {
      setError(err.message || "فشل إرسال رابط التحقق. حاول مرة أخرى.");
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
                  {step === "email" ? "التحقق من البريد الإلكتروني" : ""}
                </h2>
                <p className="text-white/90 ">
                  {step === "email"
                    ? "للوصول إلى النموذج، يرجى استخدام رابط التحقق المرسل إلى بريدك الالكتروني"
                    : `تم إرسال رابط التحقق إلى ${email}`}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {step === "email" ? (
                  <form onSubmit={handleSendMagicLink} className="space-y-6">
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
                          <span>إرسال</span>
                          <ArrowLeft className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <div className="space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto"
                    >
                      <Check className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <div>
                      <p className="text-gray-600 mb-4">
                        تم إرسال رابط التحقق إلى بريدك الإلكتروني.
                        <br />
                        اضغط على الرابط المرسل لتأكيد بريدك الالكتروني والوصول
                        إلى النموذج.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="w-full mt-6 text-sm text-blue-600 hover:text-blue-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      <span>تغيير البريد الإلكتروني</span>
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
