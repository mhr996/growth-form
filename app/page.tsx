"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { EmailVerificationModal } from "@/components/email-verification-modal";
import { WelcomeModal } from "@/components/welcome-modal";
import { SuccessModal } from "@/components/success-modal";
import { WhatsAppTestModal } from "@/components/whatsapp-test-modal";
import { DynamicFormField } from "@/components/dynamic-form-field";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 1, label: "المعلومات الأساسية والموائمة" },
  { id: 2, label: "الجدارات الأساسية" },
  { id: 3, label: "التحدي الريادي" },
];

interface FormFieldData {
  id: string;
  field_name: string;
  label: string;
  placeholder: string | null;
  tooltip: string | null;
  field_type: string;
  options?: any;
  validation_rules?: any;
  display_order: number;
  is_required: boolean;
  stage: number;
  full_width?: boolean;
  is_ai_calculated?: boolean;
  has_weight?: boolean;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const { user, loading } = useAuth();
  const [formFields, setFormFields] = useState<FormFieldData[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loadingFields, setLoadingFields] = useState(true);
  const [stageSettings, setStageSettings] = useState<{
    welcome_message: string;
    user_agreement: string;
    success_message: string;
  } | null>(null);

  // Check if user has already submitted (do this FIRST before showing welcome modal)
  useEffect(() => {
    const checkSubmission = async () => {
      if (!user?.email) {
        setCheckingSubmission(false);
        return;
      }

      setCheckingSubmission(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id")
        .eq("user_email", user.email)
        .eq("stage", currentStep)
        .maybeSingle();

      if (!error && data) {
        setHasSubmitted(true);
        setIsFormLocked(true);
        setHasAcceptedTerms(true); // Skip welcome modal
        setShowWelcomeModal(false); // Ensure modal is closed
        setLoadingFields(true); // Keep skeleton visible for locked state
      }
      setCheckingSubmission(false);
    };

    if (user && !loading) {
      checkSubmission();
    }
  }, [user, loading, currentStep]);

  // Load form fields from database (only if form is not locked)
  useEffect(() => {
    // Don't load fields if form is locked - keep showing skeleton
    if (isFormLocked) {
      setLoadingFields(true);
      return;
    }

    const fetchFields = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .eq("stage", currentStep)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setFormFields(data);
      }
      setLoadingFields(false);
    };

    // Only fetch if user is authenticated and accepted terms
    if (user && hasAcceptedTerms && !isFormLocked) {
      fetchFields();
    }
  }, [currentStep, user, hasAcceptedTerms, isFormLocked]);

  // Load stage settings
  useEffect(() => {
    const fetchStageSettings = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stage_settings")
        .select("welcome_message, user_agreement, success_message")
        .eq("stage", currentStep)
        .single();

      if (!error && data) {
        setStageSettings(data);
      }
    };

    fetchStageSettings();
  }, [currentStep]);

  // Check if user is authenticated and show appropriate modal
  useEffect(() => {
    if (!loading && !user) {
      setShowVerificationModal(true);
      setHasAcceptedTerms(false);
    } else if (
      !loading &&
      user &&
      !hasAcceptedTerms &&
      !isFormLocked &&
      !checkingSubmission
    ) {
      // Only show welcome modal if user hasn't submitted and we've finished checking
      setShowWelcomeModal(true);
    }
  }, [user, loading, hasAcceptedTerms, isFormLocked, checkingSubmission]);

  const handleVerified = () => {
    setShowVerificationModal(false);
  };

  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    setShowWelcomeModal(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    formFields.forEach((field) => {
      // Check if field should be shown based on conditional rules
      if (field.validation_rules?.conditional) {
        const {
          field: condField,
          operator,
          values,
        } = field.validation_rules.conditional;
        const condValue = formValues[condField];

        if (operator === "in" && !values.includes(condValue)) {
          return; // Skip validation if field is not shown
        }
      }

      const value = formValues[field.field_name];

      if (field.is_required && !value) {
        errors[field.field_name] = `${field.label} مطلوب`;
        return;
      }

      if (value && field.validation_rules) {
        const rules = field.validation_rules;

        // Min length
        if (rules.minLength && value.length < rules.minLength) {
          errors[
            field.field_name
          ] = `${field.label} يجب أن يكون ${rules.minLength} أحرف على الأقل`;
        }

        // Max length
        if (rules.maxLength && value.length > rules.maxLength) {
          errors[
            field.field_name
          ] = `${field.label} يجب ألا يتجاوز ${rules.maxLength} حرف`;
        }

        // Pattern (skip for phone numbers as we handle them separately)
        if (rules.pattern && field.field_type !== "tel") {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            errors[field.field_name] =
              rules.errorMessage || `${field.label} غير صحيح`;
          }
        }

        // Phone number validation - only digits and minimum 10 digits
        if (field.field_type === "tel") {
          const digitsOnly = value.replace(/\D/g, "");
          if (digitsOnly.length < 10) {
            errors[field.field_name] =
              "رقم الجوال يجب أن يحتوي على 10 أرقام على الأقل";
          }
        }

        // Email validation
        if (field.field_type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[field.field_name] = "البريد الإلكتروني غير صحيح";
          }
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prevent submission if already submitted
    if (isFormLocked) {
      alert("لقد قمت بإرسال النموذج مسبقاً");
      return;
    }

    console.log("Form Data:", formValues);

    const supabase = createClient();

    try {
      // Calculate score based on weighted fields
      let totalScore = 0;
      formFields.forEach((field) => {
        // Only calculate for fields with weights enabled
        if (field.has_weight && field.options?.options) {
          const userAnswer = formValues[field.field_name];
          if (userAnswer) {
            // Find the selected option and get its weight
            const selectedOption = field.options.options.find(
              (opt: any) => opt.value === userAnswer
            );
            if (selectedOption && selectedOption.weight) {
              totalScore += selectedOption.weight;
            }
          }
        }
      });

      console.log("Calculated Score:", totalScore);

      const { data: submission, error } = await supabase
        .from("form_submissions")
        .insert([
          {
            user_email: user?.email,
            stage: currentStep,
            data: formValues,
            score: totalScore,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Lock the form and show success modal immediately
      setIsFormLocked(true);
      setHasSubmitted(true);
      setShowSuccessModal(true);

      // Trigger async AI evaluation for Stage 1 only (don't wait for it)
      if (currentStep === 1 && submission?.id) {
        fetch("/api/evaluate-submission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: submission.id,
            userEmail: user?.email,
            formData: formValues,
          }),
        }).catch((err) => {
          // Log error but don't affect user experience
          console.error("AI evaluation failed (background process):", err);
        });
      }
    } catch (error) {
      console.error("Error saving form:", error);
      alert("حدث خطأ أثناء حفظ البيانات");
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#2A3984] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onVerified={handleVerified}
      />

      {/* Welcome Modal */}
      {stageSettings && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onAccept={handleAcceptTerms}
          welcomeMessage={stageSettings.welcome_message || ""}
          userAgreement={stageSettings.user_agreement || ""}
        />
      )}

      {/* Success Modal */}
      {stageSettings && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={stageSettings.success_message || ""}
        />
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(42,57,132,0.05)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(42,57,132,0.03)_0%,transparent_50%)]"></div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl border border-green-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-800 font-medium">
                تم حفظ البيانات بنجاح!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-10"
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 drop-shadow-xl">
              <Image
                src="/logo.webp"
                alt="Growth Plus"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          >
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-br from-[#2A3984] via-[#2A3984] to-[#1e2a5c] px-8 py-8 sm:py-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
              <div className="relative">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-3"
                >
                  نموذج التسجيل في برنامج Growth Plus
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/90 text-center text-sm sm:text-base"
                >
                  يرجى ملء البيانات المطلوبة بدقة واهتمام
                </motion.p>
              </div>
            </div>

            {/* Stepper */}
            <div className="px-6 sm:px-10 py-8 border-b border-gray-100">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute right-0 top-1/2 h-1 w-full -translate-y-1/2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f]"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${
                        ((currentStep - 1) / (STEPS.length - 1)) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>

                {/* Steps */}
                {STEPS.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;

                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center gap-3 relative z-10"
                    >
                      <motion.div
                        className={`
                          w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-lg
                          transition-all duration-300 shadow-lg
                          ${
                            isCompleted
                              ? "bg-gradient-to-br from-[#2A3984] to-[#1e2a5c] text-white scale-100"
                              : ""
                          }
                          ${
                            isCurrent
                              ? "bg-white text-[#2A3984] ring-4 ring-[#2A3984]/20 scale-110"
                              : ""
                          }
                          ${
                            !isCompleted && !isCurrent
                              ? "bg-gray-100 text-gray-400 scale-95"
                              : ""
                          }
                        `}
                        animate={{
                          scale: isCurrent ? 1.1 : isCompleted ? 1 : 0.95,
                        }}
                      >
                        {isCompleted ? (
                          <svg
                            className="w-7 h-7"
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
                          text-xs sm:text-sm font-medium text-center max-w-[100px]
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

            {/* Form */}
            <div className="px-6 sm:px-10 py-10">
              {!user || !hasAcceptedTerms ? (
                // Show skeleton/loading state when not authenticated or terms not accepted
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>

                  {/* Overlay message */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl">
                    <div className="text-center p-8 bg-white rounded-2xl shadow-xl border-2 border-[#2A3984]/20">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : loadingFields ? (
                // Loading fields from database
                <div className="space-y-6 relative">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-14 bg-gray-200 rounded-xl"></div>
                  </div>
                  {isFormLocked && (
                    <div className="absolute inset-0  backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
                      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border-2 border-green-500/30">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-12 h-12 text-white"
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
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          مرحباً بك مرة أخرى
                        </h3>
                        <p className="text-gray-600">
                          تم استقبال طلبك مسبقاً، انتظر النتيجة خلال الساعات
                          القادمة
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Show actual form when authenticated and fields loaded
                <motion.form
                  onSubmit={onSubmit}
                  className="space-y-6 relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Form Locked Overlay */}
                  {isFormLocked && (
                    <div className="absolute inset-0 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
                      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border-2 border-green-500/30">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-12 h-12 text-white"
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
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          مرحباً بك مرة أخرى
                        </h3>
                        <p className="text-gray-600">
                          تم استقبال طلبك مسبقاً، انتظر النتيجة خلال الساعات
                          القادمة
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields - 2 columns grid with full-width support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map((field) => {
                      // Check if field should be shown based on conditional rules
                      const shouldShow = () => {
                        if (!field.validation_rules?.conditional) return true;

                        const {
                          field: condField,
                          operator,
                          values,
                          value: condRequiredValue,
                        } = field.validation_rules.conditional;
                        const condValue = formValues[condField];

                        if (operator === "in") {
                          return values.includes(condValue);
                        }
                        if (operator === "equals") {
                          return condValue === condRequiredValue;
                        }

                        return true;
                      };

                      if (!shouldShow()) return null;

                      return (
                        <div
                          key={field.id}
                          className={field.full_width ? "md:col-span-2" : ""}
                        >
                          <DynamicFormField
                            field={field}
                            value={formValues[field.field_name]}
                            onChange={(value) =>
                              setFormValues((prev) => ({
                                ...prev,
                                [field.field_name]: value,
                              }))
                            }
                            error={formErrors[field.field_name]}
                            userEmail={user?.email}
                            formValues={formValues}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isFormLocked}
                    whileHover={{ scale: isFormLocked ? 1 : 1.02 }}
                    whileTap={{ scale: isFormLocked ? 1 : 0.98 }}
                    className={`w-full mt-8 px-8 py-5 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                      isFormLocked
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white hover:shadow-2xl"
                    }`}
                  >
                    <span>إرسال</span>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </motion.button>
                </motion.form>
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-gray-600 text-sm mt-8 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5 text-[#2A3984]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            جميع المعلومات المقدمة ستبقى سرية وآمنة
          </motion.p>
        </div>
      </div>

      {/* Modals */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onVerified={() => setShowVerificationModal(false)}
      />
      <WelcomeModal
        isOpen={showWelcomeModal}
        onAccept={() => {
          setHasAcceptedTerms(true);
          setShowWelcomeModal(false);
        }}
        welcomeMessage={stageSettings?.welcome_message || ""}
        userAgreement={stageSettings?.user_agreement || ""}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={stageSettings?.success_message || ""}
      />
      <WhatsAppTestModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
}
