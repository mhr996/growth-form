"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle, Settings } from "lucide-react";

export default function SettingsPage() {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("stage_settings")
        .select("active_stage")
        .eq("stage", 1) // Load from stage 1 row
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setActiveStage(data.active_stage || 1);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      // Check if settings exist for stage 1
      const { data: existing } = await supabase
        .from("stage_settings")
        .select("id")
        .eq("stage", 1)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("stage_settings")
          .update({ active_stage: activeStage })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new with stage column
        const { error } = await supabase
          .from("stage_settings")
          .insert({ stage: 1, active_stage: activeStage });

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2A3984]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
            <Settings className="w-8 h-8 text-[#2A3984]" />
            <h1 className="text-3xl font-bold text-gray-900">
              الإعدادات العامة
            </h1>
          </div>

          {/* Active Stage Selection */}
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                المرحلة النشطة
              </h2>
              <p className="text-gray-600">
                اختر المرحلة التي سيتم عرض حقولها في النموذج الأساسي
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    activeStage === stage
                      ? "border-[#2A3984] bg-gradient-to-br from-[#2A3984]/10 to-[#3a4a9f]/10 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {activeStage === stage && (
                      <CheckCircle className="w-6 h-6 text-[#2A3984]" />
                    )}
                    <span
                      className={`text-4xl font-bold ${
                        activeStage === stage
                          ? "text-[#2A3984]"
                          : "text-gray-400"
                      }`}
                    >
                      {stage}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        activeStage === stage
                          ? "text-[#2A3984]"
                          : "text-gray-500"
                      }`}
                    >
                      المرحلة {stage}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ الإعدادات</span>
                  </>
                )}
              </button>

              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">تم الحفظ بنجاح</span>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> عند تغيير المرحلة النشطة، سيتم عرض حقول
                المرحلة المختارة فقط في النموذج الأساسي الذي يراه المستخدمون.
                تأكد من إعداد جميع حقول المرحلة قبل تفعيلها.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
