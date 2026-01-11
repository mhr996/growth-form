"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AIPromptBuilderModal } from "./ai-prompt-builder-modal";

interface FormField {
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
  weight?: number | null;
  has_weight?: boolean;
  is_ai_calculated?: boolean;
  full_width?: boolean;
  question_title?: string | null;
  ai_prompt?: any;
}

interface FieldEditModalStage2Props {
  isOpen: boolean;
  field: FormField | null;
  onClose: () => void;
  onUpdate: (field: FormField) => void;
}

export function FieldEditModalStage2({
  isOpen,
  field,
  onClose,
  onUpdate,
}: FieldEditModalStage2Props) {
  const [formData, setFormData] = useState<FormField | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAiPromptBuilder, setShowAiPromptBuilder] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
    }
  }, [field]);

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("form_fields")
        .update({
          label: formData.label,
          placeholder: formData.placeholder,
          tooltip: formData.tooltip,
          options: formData.options,
          validation_rules: formData.validation_rules,
          is_required: formData.is_required,
          weight: formData.weight,
          has_weight: formData.has_weight,
          full_width: formData.full_width,
          question_title: formData.question_title,
          ai_prompt: formData.ai_prompt,
        })
        .eq("id", formData.id);

      if (error) throw error;

      onUpdate(formData);
    } catch (error: any) {
      console.error("Error updating field:", error);
      alert("فشل تحديث الحقل");
    } finally {
      setSaving(false);
    }
  };

  const handleCorrectAnswerChange = (optionValue: string) => {
    if (!formData || !formData.options?.options) return;

    const updatedOptions = formData.options.options.map((opt: any) => ({
      ...opt,
      weight: opt.value === optionValue ? formData.weight || 0 : 0,
    }));

    setFormData({
      ...formData,
      options: {
        ...formData.options,
        options: updatedOptions,
      },
    });
  };

  const getCorrectAnswer = () => {
    if (!formData?.options?.options) return "";
    const correctOption = formData.options.options.find(
      (opt: any) => opt.weight && opt.weight > 0
    );
    return correctOption?.value || "";
  };

  if (!isOpen || !formData) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">تعديل الحقل</h2>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="space-y-6">
                    {/* Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نص السؤال
                      </label>
                      <textarea
                        value={formData.label}
                        onChange={(e) =>
                          setFormData({ ...formData, label: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-transparent"
                      />
                    </div>

                    {/* Question Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان السؤال (اختياري)
                      </label>
                      <input
                        type="text"
                        value={formData.question_title || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            question_title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-transparent"
                      />
                    </div>

                    {/* Placeholder */}
                    {formData.field_type === "textarea" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          نص توضيحي
                        </label>
                        <input
                          type="text"
                          value={formData.placeholder || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              placeholder: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        وزن السؤال (النقاط)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.weight || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weight: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A3984] focus:border-transparent"
                      />
                    </div>

                    {/* Correct Answer Selection for MCQ */}
                    {formData.field_type === "radio" &&
                      formData.options?.options && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الإجابة الصحيحة
                          </label>
                          <div className="space-y-2">
                            {formData.options.options.map((option: any) => (
                              <label
                                key={option.value}
                                className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                                style={{
                                  borderColor:
                                    getCorrectAnswer() === option.value
                                      ? "#2A3984"
                                      : "#e5e7eb",
                                  backgroundColor:
                                    getCorrectAnswer() === option.value
                                      ? "#f0f4ff"
                                      : "white",
                                }}
                              >
                                <input
                                  type="radio"
                                  name="correct_answer"
                                  value={option.value}
                                  checked={getCorrectAnswer() === option.value}
                                  onChange={(e) =>
                                    handleCorrectAnswerChange(e.target.value)
                                  }
                                  className="w-5 h-5 text-[#2A3984]"
                                />
                                <span className="flex-1">{option.label}</span>
                                {getCorrectAnswer() === option.value && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    ✓ صحيح ({formData.weight} نقطة)
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* AI Prompt for AI-calculated fields */}
                    {formData.is_ai_calculated && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تعليمات التقييم بالذكاء الاصطناعي
                        </label>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <p className="text-sm text-purple-700 mb-3">
                            {formData.ai_prompt?.prompt ||
                              "لم يتم تعيين تعليمات التقييم"}
                          </p>
                          <button
                            onClick={() => setShowAiPromptBuilder(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>تعديل تعليمات AI</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Required Checkbox */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_required}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_required: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-[#2A3984] rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          حقل مطلوب
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
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
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* AI Prompt Builder Modal */}
      {formData?.is_ai_calculated && (
        <AIPromptBuilderModal
          isOpen={showAiPromptBuilder}
          onClose={() => setShowAiPromptBuilder(false)}
          initialPrompt={formData.ai_prompt?.prompt || ""}
          onSave={(prompt) => {
            setFormData({
              ...formData,
              ai_prompt: {
                ...formData.ai_prompt,
                prompt: prompt,
              },
            });
            setShowAiPromptBuilder(false);
          }}
        />
      )}
    </>
  );
}
