"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WelcomeMessagePage() {
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [userAgreement, setUserAgreement] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setLoading(true);
      const { data, error } = await supabase
        .from("stage_settings")
        .select("*")
        .eq("stage", 4)
        .single();

      if (error) throw error;

      if (data) {
        setWelcomeMessage(data.welcome_message || "");
        setUserAgreement(data.user_agreement || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({
        type: "error",
        text: "فشل تحميل الإعدادات. تأكد من تشغيل السكربت في Supabase.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("stage_settings")
        .update({
          welcome_message: welcomeMessage,
          user_agreement: userAgreement,
        })
        .eq("stage", 4);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "تم حفظ التغييرات بنجاح!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ التغييرات. حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-[#2A3984] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            رسالة الترحيب والموافقة - المرحلة الرابعة
          </h1>
          <p className="text-gray-600">
            قم بتعديل رسالة الترحيب وشروط الاستخدام التي ستظهر للمستخدمين قبل
            البدء بالنموذج
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-6">
              <h2 className="text-xl font-bold text-white">رسالة الترحيب</h2>
              <p className="text-white/80 text-sm mt-1">
                سيتم عرض هذه الرسالة للمستخدم بعد التحقق من بريده الإلكتروني
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all resize-none"
                placeholder="اكتب رسالة الترحيب هنا..."
              />
              <p className="text-xs text-gray-500 mt-2">
                يمكنك استخدام أسطر متعددة. سيتم عرض النص كما هو.
              </p>
            </div>
          </div>

          {/* Agreement Text */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
              <h2 className="text-xl font-bold text-white">
                نص الموافقة (سطر واحد)
              </h2>
              <p className="text-white/80 text-sm mt-1">
                سيظهر هذا النص بجانب مربع الاختيار الذي يجب على المستخدم تحديده
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={userAgreement}
                onChange={(e) => setUserAgreement(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-600/20 focus:border-amber-600 transition-all resize-none"
                placeholder="مثال: أتفهم وأوافق أن البرنامج يتطلب التزام حضوري طوال مدة البرنامج [..] من الساعة [..] إلى الساعة [..] في مدينة الرياض، حي النخيل."
              />
              <p className="text-xs text-gray-500 mt-2">
                يمكنك استخدام [..] للإشارة إلى معلومات ستضاف لاحقاً
              </p>
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
