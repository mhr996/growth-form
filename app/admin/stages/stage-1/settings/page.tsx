"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  AlertTriangle,
  X,
  CheckCircle2,
  Send,
  FlaskConical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PostStageTestModal } from "@/components/post-stage-test-modal";

type TabType = "pre-stage" | "post-stage";
type PostStageSubTab = "passed" | "failed";

export default function Stage1SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("post-stage");
  const [postStageSubTab, setPostStageSubTab] =
    useState<PostStageSubTab>("passed");
  const [passedEmailContent, setPassedEmailContent] = useState("");
  const [failedEmailContent, setFailedEmailContent] = useState("");
  const [preStageEmailContent, setPreStageEmailContent] = useState("");
  const [passedEmailSubject, setPassedEmailSubject] = useState("");
  const [failedEmailSubject, setFailedEmailSubject] = useState("");
  const [preStageEmailSubject, setPreStageEmailSubject] = useState("");
  const [preStageWhatsappTemplate, setPreStageWhatsappTemplate] = useState("");
  const [preStageWhatsappImage, setPreStageWhatsappImage] = useState("");
  const [passedWhatsappTemplate, setPassedWhatsappTemplate] = useState("");
  const [passedWhatsappImage, setPassedWhatsappImage] = useState("");
  const [failedWhatsappTemplate, setFailedWhatsappTemplate] = useState("");
  const [failedWhatsappImage, setFailedWhatsappImage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
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
        setPreStageEmailContent(data.pre_stage_email_content || "");
        setPassedEmailSubject(data.passed_email_subject || "");
        setFailedEmailSubject(data.failed_email_subject || "");
        setPreStageEmailSubject(data.pre_stage_email_subject || "");
        setPreStageWhatsappTemplate(data.pre_stage_whatsapp_template || "");
        setPreStageWhatsappImage(data.pre_stage_whatsapp_image || "");
        setPassedWhatsappTemplate(data.passed_whatsapp_template || "");
        setPassedWhatsappImage(data.passed_whatsapp_image || "");
        setFailedWhatsappTemplate(data.failed_whatsapp_template || "");
        setFailedWhatsappImage(data.failed_whatsapp_image || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSavePostStageSettings = async () => {
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
            passed_email_subject: passedEmailSubject,
            failed_email_subject: failedEmailSubject,
            passed_whatsapp_template: passedWhatsappTemplate,
            passed_whatsapp_image: passedWhatsappImage,
            failed_whatsapp_template: failedWhatsappTemplate,
            failed_whatsapp_image: failedWhatsappImage,
            updated_at: new Date().toISOString(),
          })
          .eq("stage", 1);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("stage_settings").insert({
          stage: 1,
          passed_email_content: passedEmailContent,
          failed_email_content: failedEmailContent,
          passed_email_subject: passedEmailSubject,
          failed_email_subject: failedEmailSubject,
          passed_whatsapp_template: passedWhatsappTemplate,
          passed_whatsapp_image: passedWhatsappImage,
          failed_whatsapp_template: failedWhatsappTemplate,
          failed_whatsapp_image: failedWhatsappImage,
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

  const handleSavePreStageEmail = async () => {
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
            pre_stage_email_content: preStageEmailContent,
            pre_stage_email_subject: preStageEmailSubject,
            pre_stage_whatsapp_template: preStageWhatsappTemplate,
            pre_stage_whatsapp_image: preStageWhatsappImage,
            updated_at: new Date().toISOString(),
          })
          .eq("stage", 1);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("stage_settings").insert({
          stage: 1,
          pre_stage_email_content: preStageEmailContent,
          pre_stage_email_subject: preStageEmailSubject,
          pre_stage_whatsapp_template: preStageWhatsappTemplate,
          pre_stage_whatsapp_image: preStageWhatsappImage,
        });

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "تم حفظ محتوى البريد الإلكتروني بنجاح!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving pre-stage email:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ محتوى البريد الإلكتروني. حاول مرة أخرى.",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSendPreStageEmail = async () => {
    if (!preStageEmailContent.trim() || !preStageEmailSubject.trim()) {
      setMessage({
        type: "error",
        text: "يرجى كتابة عنوان ومحتوى البريد الإلكتروني أولاً",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSending(true);
    try {
      // Get all users who submitted forms in this stage
      const { data: submissions, error: fetchError } = await supabase
        .from("form_submissions")
        .select("data, user_email")
        .eq("stage", 1);

      if (fetchError) throw fetchError;

      if (!submissions || submissions.length === 0) {
        setMessage({ type: "error", text: "لا يوجد مستخدمين في هذه المرحلة" });
        setTimeout(() => setMessage(null), 3000);
        setSending(false);
        return;
      }

      // Create unique recipients list (in case a user submitted multiple times)
      const uniqueRecipients = Array.from(
        new Map(
          submissions.map((s) => {
            const parsedData =
              typeof s.data === "string" ? JSON.parse(s.data) : s.data;
            return [
              s.user_email,
              {
                name: parsedData.fullName || "مستخدم",
                email: s.user_email,
                phone: parsedData.phoneNumber || parsedData.phone || null,
              },
            ];
          })
        ).values()
      );

      // Send both emails and WhatsApp messages via API
      const response = await fetch("/api/send-stage-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: uniqueRecipients,
          emailSubject: preStageEmailSubject,
          emailContent: preStageEmailContent,
          whatsappTemplate: preStageWhatsappTemplate,
          whatsappImage: preStageWhatsappImage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send messages");
      }

      setMessage({
        type: "success",
        text: `تم الإرسال بنجاح! إيميلات: ${result.emailsSent}، واتساب: ${
          result.whatsappsSent
        }${result.errors.length > 0 ? `، أخطاء: ${result.errors.length}` : ""}`,
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Error sending messages:", error);
      setMessage({
        type: "error",
        text: `فشل الإرسال: ${error.message}`,
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleEndStage = async () => {
    setShowConfirmModal(false);
    setSending(true);

    try {
      // Send post-stage messages (emails and WhatsApp) to nominated and excluded users
      const response = await fetch("/api/end-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: 1,
          settings: {
            passedEmailSubject,
            passedEmailContent,
            failedEmailSubject,
            failedEmailContent,
            passedWhatsappTemplate,
            passedWhatsappImage,
            failedWhatsappTemplate,
            failedWhatsappImage,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to end stage");
      }

      setMessage({
        type: "success",
        text: `تم إنهاء المرحلة بنجاح! تم الإرسال: إيميلات: ${result.totalEmailsSent}، واتساب: ${result.totalWhatsappsSent}. ناجحين: ${result.nominatedCount}، راسبين: ${result.excludedCount}`,
      });
      setTimeout(() => setMessage(null), 10000);
    } catch (error: any) {
      console.error("Error ending stage:", error);
      setMessage({
        type: "error",
        text: `فشل إنهاء المرحلة: ${error.message}`,
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSending(false);
    }
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b-2 border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("pre-stage")}
              className={`
                px-6 py-3 font-semibold transition-all relative
                ${
                  activeTab === "pre-stage"
                    ? "text-[#2A3984]"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              رسائل ما قبل المرحلة
              {activeTab === "pre-stage" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A3984]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("post-stage")}
              className={`
                px-6 py-3 font-semibold transition-all relative
                ${
                  activeTab === "post-stage"
                    ? "text-[#2A3984]"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              رسائل ما بعد المرحلة
              {activeTab === "post-stage" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A3984]"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "pre-stage" ? (
          <motion.div
            key="pre-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Pre-Stage Email Content */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                محتوى البريد الإلكتروني للمرحلة
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                هذا البريد سيتم إرساله لجميع المستخدمين في هذه المرحلة
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    عنوان البريد الإلكتروني
                  </label>
                  <input
                    type="text"
                    value={preStageEmailSubject}
                    onChange={(e) => setPreStageEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all"
                    placeholder="مثال: إعلان هام عن المرحلة الأولى"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    محتوى البريد الإلكتروني
                  </label>
                  <textarea
                    value={preStageEmailContent}
                    onChange={(e) => setPreStageEmailContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all resize-none"
                    placeholder="اكتب محتوى البريد الإلكتروني هنا..."
                  />
                </div>
              </div>
            </div>

            {/* Pre-Stage WhatsApp Content */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                محتوى رسالة الواتساب للمرحلة
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                هذه الرسالة سيتم إرسالها لجميع المستخدمين في هذه المرحلة عبر
                الواتساب
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم القالب (Template Name)
                  </label>
                  <input
                    type="text"
                    value={preStageWhatsappTemplate}
                    onChange={(e) =>
                      setPreStageWhatsappTemplate(e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all"
                    placeholder="مثال: pre_stage_1_announcement"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    استخدم {"{{name}}"} في القالب ليتم استبداله باسم المستخدم
                    تلقائياً
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رابط الصورة (اختياري)
                  </label>
                  <input
                    type="url"
                    value={preStageWhatsappImage}
                    onChange={(e) => setPreStageWhatsappImage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSavePreStageEmail}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ المحتوى</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendPreStageEmail}
                disabled={sending || !preStageEmailContent.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>إرسال إيميل وواتساب لجميع المستخدمين</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="post-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Sub-tabs for Passed/Failed */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setPostStageSubTab("passed")}
                  className={`
                    flex-1 px-6 py-3 rounded-xl font-bold transition-all
                    ${
                      postStageSubTab === "passed"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>رسائل الناجحين</span>
                  </div>
                </button>
                <button
                  onClick={() => setPostStageSubTab("failed")}
                  className={`
                    flex-1 px-6 py-3 rounded-xl font-bold transition-all
                    ${
                      postStageSubTab === "failed"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5" />
                    <span>رسائل غير الناجحين</span>
                  </div>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {postStageSubTab === "passed" ? (
                <motion.div
                  key="passed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Passed Users Email */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-bold text-green-900">
                        محتوى البريد الإلكتروني للمتقدمين الناجحين
                      </h2>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      هذا البريد سيتم إرساله للمستخدمين الذين اجتازوا المرحلة
                      بنجاح
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          عنوان البريد الإلكتروني
                        </label>
                        <input
                          type="text"
                          value={passedEmailSubject}
                          onChange={(e) =>
                            setPassedEmailSubject(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
                          placeholder="مثال: مبروك! تم قبولك للمرحلة التالية"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          محتوى البريد الإلكتروني
                        </label>
                        <textarea
                          value={passedEmailContent}
                          onChange={(e) =>
                            setPassedEmailContent(e.target.value)
                          }
                          rows={8}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none bg-white"
                          placeholder="اكتب محتوى البريد الإلكتروني هنا..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passed Users WhatsApp */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-bold text-green-900">
                        محتوى رسالة الواتساب للمتقدمين الناجحين
                      </h2>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      هذه الرسالة سيتم إرسالها للمستخدمين الذين اجتازوا المرحلة
                      بنجاح عبر الواتساب
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          اسم القالب (Template Name)
                        </label>
                        <input
                          type="text"
                          value={passedWhatsappTemplate}
                          onChange={(e) =>
                            setPassedWhatsappTemplate(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
                          placeholder="مثال: stage_1_passed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          استخدم {"{{name}}"} في القالب ليتم استبداله باسم
                          المستخدم تلقائياً
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          رابط الصورة (اختياري)
                        </label>
                        <input
                          type="url"
                          value={passedWhatsappImage}
                          onChange={(e) =>
                            setPassedWhatsappImage(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Failed Users Email */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-300 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <X className="w-6 h-6 text-red-600" />
                      <h2 className="text-xl font-bold text-red-900">
                        محتوى البريد الإلكتروني للمتقدمين غير الناجحين
                      </h2>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      هذا البريد سيتم إرساله للمستخدمين الذين لم يجتازوا المرحلة
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          عنوان البريد الإلكتروني
                        </label>
                        <input
                          type="text"
                          value={failedEmailSubject}
                          onChange={(e) =>
                            setFailedEmailSubject(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
                          placeholder="مثال: شكراً لتقديمك على البرنامج"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          محتوى البريد الإلكتروني
                        </label>
                        <textarea
                          value={failedEmailContent}
                          onChange={(e) =>
                            setFailedEmailContent(e.target.value)
                          }
                          rows={8}
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none bg-white"
                          placeholder="اكتب محتوى البريد الإلكتروني هنا..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Failed Users WhatsApp */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-300 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <X className="w-6 h-6 text-red-600" />
                      <h2 className="text-xl font-bold text-red-900">
                        محتوى رسالة الواتساب للمتقدمين غير الناجحين
                      </h2>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      هذه الرسالة سيتم إرسالها للمستخدمين الذين لم يجتازوا
                      المرحلة عبر الواتساب
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          اسم القالب (Template Name)
                        </label>
                        <input
                          type="text"
                          value={failedWhatsappTemplate}
                          onChange={(e) =>
                            setFailedWhatsappTemplate(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
                          placeholder="مثال: stage_1_failed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          استخدم {"{{name}}"} في القالب ليتم استبداله باسم
                          المستخدم تلقائياً
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          رابط الصورة (اختياري)
                        </label>
                        <input
                          type="url"
                          value={failedWhatsappImage}
                          onChange={(e) =>
                            setFailedWhatsappImage(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save and Test Buttons */}
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTestModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <FlaskConical className="w-5 h-5" />
                <span>اختبار الإرسال</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSavePostStageSettings}
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
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Post Stage Test Modal */}
      <PostStageTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        stage={1}
      />
    </div>
  );
}
