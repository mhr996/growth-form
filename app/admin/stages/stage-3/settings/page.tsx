"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  AlertTriangle,
  X,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TabType = "pre-stage" | "post-stage";
type PostStageSubTab = "passed" | "failed";

export default function Stage3SettingsPage() {
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
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>(
    {}
  );
  const [preStageSelectedChannels, setPreStageSelectedChannels] = useState<
    string[]
  >([]);
  const [postStageSelectedChannels, setPostStageSelectedChannels] = useState<
    string[]
  >([]);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
    emailsSent: 0,
    whatsappsSent: 0,
    errors: [] as string[],
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
    fetchChannelCounts();
  }, []);

  const fetchChannelCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("channel")
        .eq("stage", 3)
        .not("channel", "is", null);

      if (error) throw error;

      // Count submissions per channel
      const counts: Record<string, number> = {};
      data.forEach((s) => {
        if (s.channel) {
          counts[s.channel] = (counts[s.channel] || 0) + 1;
        }
      });
      setChannelCounts(counts);
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const togglePreStageChannel = (channel: string) => {
    setPreStageSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleAllPreStageChannels = () => {
    const allChannels = Object.keys(channelCounts);
    if (preStageSelectedChannels.length === allChannels.length) {
      setPreStageSelectedChannels([]);
    } else {
      setPreStageSelectedChannels([...allChannels]);
    }
  };

  const togglePostStageChannel = (channel: string) => {
    setPostStageSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleAllPostStageChannels = () => {
    const allChannels = Object.keys(channelCounts);
    if (postStageSelectedChannels.length === allChannels.length) {
      setPostStageSelectedChannels([]);
    } else {
      setPostStageSelectedChannels([...allChannels]);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("stage_settings")
        .select("*")
        .eq("stage", 3)
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
        .eq("stage", 3)
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
          .eq("stage", 3);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("stage_settings").insert({
          stage: 3,
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
        .eq("stage", 3)
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
          .eq("stage", 3);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("stage_settings").insert({
          stage: 3,
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
    setShowProgressModal(true);

    try {
      // Build query with channel filter
      let query = supabase
        .from("form_submissions")
        .select("data, user_email, channel")
        .eq("stage", 3);

      // Apply channel filter if channels are selected
      if (preStageSelectedChannels.length > 0) {
        query = query.in("channel", preStageSelectedChannels);
      }

      const { data: submissions, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!submissions || submissions.length === 0) {
        setMessage({
          type: "error",
          text: "لا يوجد مستخدمين في هذه المرحلة أو القناة المحددة",
        });
        setTimeout(() => setMessage(null), 3000);
        setSending(false);
        setShowProgressModal(false);
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

      // Initialize progress
      setSendingProgress({
        current: 0,
        total: uniqueRecipients.length,
        emailsSent: 0,
        whatsappsSent: 0,
        errors: [],
      });

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

      // Update progress with results
      setSendingProgress({
        current: uniqueRecipients.length,
        total: uniqueRecipients.length,
        emailsSent: result.emailsSent || 0,
        whatsappsSent: result.whatsappsSent || 0,
        errors: result.errors || [],
      });

      setMessage({
        type: "success",
        text: `تم الإرسال بنجاح! إيميلات: ${result.emailsSent}، واتساب: ${
          result.whatsappsSent
        }${result.errors.length > 0 ? `، أخطاء: ${result.errors.length}` : ""}`,
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      setMessage({
        type: "error",
        text: `فشل إرسال البريد الإلكتروني: ${error.message}`,
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleEndStage = async () => {
    setShowConfirmModal(false);
    setSending(true);
    setShowProgressModal(true);

    try {
      // Build query to count recipients with channel filter
      let query = supabase
        .from("form_submissions")
        .select("user_email, channel", { count: "exact" })
        .eq("stage", 3);

      // Apply channel filter if channels are selected
      if (postStageSelectedChannels.length > 0) {
        query = query.in("channel", postStageSelectedChannels);
      }

      const { count } = await query;
      const totalRecipients = count || 0;

      // Initialize progress
      setSendingProgress({
        current: 0,
        total: totalRecipients,
        emailsSent: 0,
        whatsappsSent: 0,
        errors: [],
      });

      // Send post-stage messages (emails and WhatsApp) to nominated and excluded users
      const response = await fetch("/api/end-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: 3,
          channels:
            postStageSelectedChannels.length > 0
              ? postStageSelectedChannels
              : undefined,
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

      // Update progress with results
      setSendingProgress({
        current: totalRecipients,
        total: totalRecipients,
        emailsSent: result.totalEmailsSent || 0,
        whatsappsSent: result.totalWhatsappsSent || 0,
        errors: result.errors || [],
      });

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
          إعدادات المرحلة الثالثة
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
                  layoutId="activeTab3"
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
                  layoutId="activeTab3"
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
            {/* Channel Filter - Pre Stage */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-2">
                تصفية حسب القناة
              </h2>
              <p className="text-sm text-purple-700 mb-4">
                اختر القنوات التي تريد إرسال الرسائل لها (سيؤثر على الإيميل
                والواتساب)
              </p>
              {Object.keys(channelCounts).length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pre-all-channels"
                      checked={
                        preStageSelectedChannels.length ===
                        Object.keys(channelCounts).length
                      }
                      onChange={toggleAllPreStageChannels}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-600"
                    />
                    <label
                      htmlFor="pre-all-channels"
                      className="text-sm font-bold text-gray-900 cursor-pointer"
                    >
                      جميع القنوات (
                      {Object.values(channelCounts).reduce((a, b) => a + b, 0)}{" "}
                      مستخدم)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(channelCounts)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([channel, count]) => (
                        <div
                          key={channel}
                          className="flex items-center gap-2 bg-white p-3 rounded-lg border border-purple-200"
                        >
                          <input
                            type="checkbox"
                            id={`pre-channel-${channel}`}
                            checked={preStageSelectedChannels.includes(channel)}
                            onChange={() => togglePreStageChannel(channel)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-600"
                          />
                          <label
                            htmlFor={`pre-channel-${channel}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                          >
                            {channel}{" "}
                            <span className="text-purple-600 font-bold">
                              ({count})
                            </span>
                          </label>
                        </div>
                      ))}
                  </div>
                  {preStageSelectedChannels.length > 0 && (
                    <p className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                      تم اختيار {preStageSelectedChannels.length} من{" "}
                      {Object.keys(channelCounts).length} قناة (
                      {preStageSelectedChannels.reduce(
                        (sum, ch) => sum + (channelCounts[ch] || 0),
                        0
                      )}{" "}
                      مستخدم)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">لا توجد قنوات متاحة</p>
              )}
            </div>

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
                    placeholder="مثال: إعلان هام عن المرحلة الثالثة"
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
                    placeholder="مثال: pre_stage_3_announcement"
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
            {/* Channel Filter - Post Stage */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-2">
                تصفية حسب القناة
              </h2>
              <p className="text-sm text-purple-700 mb-4">
                اختر القنوات التي تريد إرسال الرسائل لها (سيؤثر على رسائل
                الناجحين وغير الناجحين)
              </p>
              {Object.keys(channelCounts).length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="post-all-channels"
                      checked={
                        postStageSelectedChannels.length ===
                        Object.keys(channelCounts).length
                      }
                      onChange={toggleAllPostStageChannels}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-600"
                    />
                    <label
                      htmlFor="post-all-channels"
                      className="text-sm font-bold text-gray-900 cursor-pointer"
                    >
                      جميع القنوات (
                      {Object.values(channelCounts).reduce((a, b) => a + b, 0)}{" "}
                      مستخدم)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(channelCounts)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([channel, count]) => (
                        <div
                          key={channel}
                          className="flex items-center gap-2 bg-white p-3 rounded-lg border border-purple-200"
                        >
                          <input
                            type="checkbox"
                            id={`post-channel-${channel}`}
                            checked={postStageSelectedChannels.includes(
                              channel
                            )}
                            onChange={() => togglePostStageChannel(channel)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-600"
                          />
                          <label
                            htmlFor={`post-channel-${channel}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                          >
                            {channel}{" "}
                            <span className="text-purple-600 font-bold">
                              ({count})
                            </span>
                          </label>
                        </div>
                      ))}
                  </div>
                  {postStageSelectedChannels.length > 0 && (
                    <p className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                      تم اختيار {postStageSelectedChannels.length} من{" "}
                      {Object.keys(channelCounts).length} قناة (
                      {postStageSelectedChannels.reduce(
                        (sum, ch) => sum + (channelCounts[ch] || 0),
                        0
                      )}{" "}
                      مستخدم)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">لا توجد قنوات متاحة</p>
              )}
            </div>

            {/* Nested Tabs for Passed/Failed */}
            <div className="flex gap-3">
              <button
                onClick={() => setPostStageSubTab("passed")}
                className={`
                  flex-1 px-6 py-3 rounded-xl font-bold transition-all
                  ${
                    postStageSubTab === "passed"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }
                `}
              >
                رسائل الناجحين
              </button>
              <button
                onClick={() => setPostStageSubTab("failed")}
                className={`
                  flex-1 px-6 py-3 rounded-xl font-bold transition-all
                  ${
                    postStageSubTab === "failed"
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg scale-105"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }
                `}
              >
                رسائل غير الناجحين
              </button>
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
                    <h2 className="text-xl font-bold text-green-900 mb-2">
                      محتوى البريد الإلكتروني للمتقدمين الناجحين
                    </h2>
                    <p className="text-sm text-green-700 mb-4">
                      هذا البريد سيتم إرساله للمستخدمين الذين اجتازوا المرحلة
                      بنجاح
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-green-900 mb-2">
                          عنوان البريد الإلكتروني
                        </label>
                        <input
                          type="text"
                          value={passedEmailSubject}
                          onChange={(e) =>
                            setPassedEmailSubject(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all bg-white"
                          placeholder="مثال: مبروك! تم قبولك للمرحلة التالية"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-green-900 mb-2">
                          محتوى البريد الإلكتروني
                        </label>
                        <textarea
                          value={passedEmailContent}
                          onChange={(e) =>
                            setPassedEmailContent(e.target.value)
                          }
                          rows={8}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all resize-none bg-white"
                          placeholder="اكتب محتوى البريد الإلكتروني هنا..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passed Users WhatsApp */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6">
                    <h2 className="text-xl font-bold text-green-900 mb-2">
                      محتوى رسالة الواتساب للمتقدمين الناجحين
                    </h2>
                    <p className="text-sm text-green-700 mb-4">
                      هذه الرسالة سيتم إرسالها للمستخدمين الذين اجتازوا المرحلة
                      بنجاح عبر الواتساب
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-green-900 mb-2">
                          اسم القالب (Template Name)
                        </label>
                        <input
                          type="text"
                          value={passedWhatsappTemplate}
                          onChange={(e) =>
                            setPassedWhatsappTemplate(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all bg-white"
                          placeholder="مثال: stage_3_passed"
                        />
                        <p className="text-xs text-green-600 mt-1">
                          استخدم {"{{name}}"} في القالب ليتم استبداله باسم
                          المستخدم تلقائياً
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-green-900 mb-2">
                          رابط الصورة (اختياري)
                        </label>
                        <input
                          type="url"
                          value={passedWhatsappImage}
                          onChange={(e) =>
                            setPassedWhatsappImage(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all bg-white"
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
                    <h2 className="text-xl font-bold text-red-900 mb-2">
                      محتوى البريد الإلكتروني للمتقدمين غير الناجحين
                    </h2>
                    <p className="text-sm text-red-700 mb-4">
                      هذا البريد سيتم إرساله للمستخدمين الذين لم يجتازوا المرحلة
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-red-900 mb-2">
                          عنوان البريد الإلكتروني
                        </label>
                        <input
                          type="text"
                          value={failedEmailSubject}
                          onChange={(e) =>
                            setFailedEmailSubject(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all bg-white"
                          placeholder="مثال: نأسف، لم يتم قبولك في هذه المرحلة"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-red-900 mb-2">
                          محتوى البريد الإلكتروني
                        </label>
                        <textarea
                          value={failedEmailContent}
                          onChange={(e) =>
                            setFailedEmailContent(e.target.value)
                          }
                          rows={8}
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all resize-none bg-white"
                          placeholder="اكتب محتوى البريد الإلكتروني هنا..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Failed Users WhatsApp */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-300 p-6">
                    <h2 className="text-xl font-bold text-red-900 mb-2">
                      محتوى رسالة الواتساب للمتقدمين غير الناجحين
                    </h2>
                    <p className="text-sm text-red-700 mb-4">
                      هذه الرسالة سيتم إرسالها للمستخدمين الذين لم يجتازوا
                      المرحلة عبر الواتساب
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-red-900 mb-2">
                          اسم القالب (Template Name)
                        </label>
                        <input
                          type="text"
                          value={failedWhatsappTemplate}
                          onChange={(e) =>
                            setFailedWhatsappTemplate(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all bg-white"
                          placeholder="مثال: stage_3_failed"
                        />
                        <p className="text-xs text-red-600 mt-1">
                          استخدم {"{{name}}"} في القالب ليتم استبداله باسم
                          المستخدم تلقائياً
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-red-900 mb-2">
                          رابط الصورة (اختياري)
                        </label>
                        <input
                          type="url"
                          value={failedWhatsappImage}
                          onChange={(e) =>
                            setFailedWhatsappImage(e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all bg-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            <div className="flex justify-end">
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
                <span>إنهاء المرحلة الثالثة</span>
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
                      هل أنت متأكد من رغبتك في إنهاء المرحلة الثالثة؟
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

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  جاري إرسال الرسائل
                </h2>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={sending}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>التقدم</span>
                    <span>
                      {sendingProgress.current} / {sendingProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          sendingProgress.total > 0
                            ? (sendingProgress.current /
                                sendingProgress.total) *
                              100
                            : 0
                        }%`,
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f]"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {sendingProgress.current === sendingProgress.total &&
                    sendingProgress.total > 0
                      ? "اكتمل الإرسال!"
                      : "يرجى الانتظار، قد يستغرق هذا عدة دقائق..."}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sendingProgress.emailsSent}
                    </div>
                    <div className="text-sm text-gray-600">إيميلات</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sendingProgress.whatsappsSent}
                    </div>
                    <div className="text-sm text-gray-600">واتساب</div>
                  </div>
                </div>

                {/* Errors */}
                {sendingProgress.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-red-800 mb-2">
                      أخطاء ({sendingProgress.errors.length}):
                    </div>
                    <div className="max-h-32 overflow-y-auto text-xs text-red-700 space-y-1">
                      {sendingProgress.errors.slice(0, 5).map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                      {sendingProgress.errors.length > 5 && (
                        <div className="text-red-600 font-semibold mt-2">
                          ... و {sendingProgress.errors.length - 5} أخطاء أخرى
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Loading Animation */}
                {sending && (
                  <div className="flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2A3984]" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
