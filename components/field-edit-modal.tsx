"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Type,
  Mail,
  Phone,
  List,
  Circle,
  Hash,
  FileText,
  ChevronDown,
  Lightbulb,
  Check,
  Square,
  Save,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AIPromptBuilderModal } from "./ai-prompt-builder-modal";

interface FieldEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
  allFields?: FormField[];
}

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
  ai_prompt?: any;
}

export function FieldEditModal({
  isOpen,
  onClose,
  field,
  onSave,
  allFields = [],
}: FieldEditModalProps) {
  const [formData, setFormData] = useState<FormField | null>(null);
  const [showAIPromptBuilder, setShowAIPromptBuilder] = useState(false);

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
    }
  }, [field]);

  if (!formData) return null;

  // Calculate total weight for options
  const getTotalWeight = () => {
    if (!formData.options?.options) return 0;
    return formData.options.options.reduce(
      (sum: number, opt: any) => sum + (opt.weight ?? 0),
      0
    );
  };

  // Auto-distribute weights evenly
  const autoDistributeWeights = (options: any[]) => {
    const count = options.length;
    if (count === 0) return options;

    const baseWeight = Math.floor(1000 / count);
    const remainder = 1000 - baseWeight * count;

    return options.map((opt: any, index: number) => ({
      ...opt,
      weight: baseWeight + (index < remainder ? 1 : 0),
    }));
  };

  const totalWeight = getTotalWeight();
  const isWeightValid = totalWeight === 1000;
  const isSelectOrRadio =
    formData.field_type === "select" || formData.field_type === "radio";

  // Check if field has 2+ options (only then can it have weights)
  const hasMultipleOptions = (formData.options?.options || []).length >= 2;
  const shouldShowWeights = isSelectOrRadio && hasMultipleOptions;

  const handleSave = () => {
    // Automatically set has_weight based on number of options
    const hasMultipleOptions = (formData.options?.options || []).length >= 2;

    const updatedFormData = {
      ...formData,
      has_weight: isSelectOrRadio && hasMultipleOptions,
    };

    onSave(updatedFormData);
    onClose();
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#2A3984] to-[#1e2a5c] p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      تعديل الحقل
                    </h2>
                    <p className="text-white/80 text-sm">
                      {formData.field_name}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-5">
                {/* Field Type Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2A3984]/10 text-[#2A3984] text-sm font-semibold">
                  {formData.field_type === "text" && (
                    <>
                      <Type className="w-4 h-4" /> نص
                    </>
                  )}
                  {formData.field_type === "email" && (
                    <>
                      <Mail className="w-4 h-4" /> بريد إلكتروني
                    </>
                  )}
                  {formData.field_type === "tel" && (
                    <>
                      <Phone className="w-4 h-4" /> هاتف
                    </>
                  )}
                  {formData.field_type === "select" && (
                    <>
                      <ChevronDown className="w-4 h-4" /> قائمة منسدلة
                    </>
                  )}
                  {formData.field_type === "radio" && (
                    <>
                      <Circle className="w-4 h-4" /> خيارات متعددة
                    </>
                  )}
                  {formData.field_type === "number" && (
                    <>
                      <Hash className="w-4 h-4" /> رقم
                    </>
                  )}
                  {formData.field_type === "textarea" && (
                    <>
                      <FileText className="w-4 h-4" /> نص طويل
                    </>
                  )}
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-[#2A3984]"></span>
                    النص المعروض <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all hover:border-gray-300"
                    placeholder="النص الذي يظهر للمستخدم"
                  />
                </div>

                {/* Placeholder */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    النص التوضيحي (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, placeholder: e.target.value })
                    }
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all hover:border-gray-300"
                    placeholder="مثال: أدخل اسمك الكامل"
                  />
                </div>

                {/* Tooltip */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    تلميح المساعدة (Tooltip)
                  </label>
                  <textarea
                    value={formData.tooltip || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, tooltip: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all resize-none hover:border-gray-300"
                    placeholder="معلومات إضافية لمساعدة المستخدم"
                  />
                </div>

                {formData.is_ai_calculated && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-900 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">
                          هذا السؤال يتم تقييمه بواسطة الذكاء الاصطناعي
                        </span>
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        لا يمكن تعيين وزن يدوي لهذا الحقل حيث سيتم حسابه
                        تلقائياً
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Prompt للذكاء الاصطناعي
                      </label>

                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAIPromptBuilder(true)}
                          className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-all flex items-center justify-center gap-3 group"
                        >
                          <Sparkles className="w-5 h-5 text-purple-600 group-hover:animate-pulse" />
                          <span className="font-bold text-purple-700">
                            {formData.ai_prompt
                              ? "تعديل Prompt"
                              : "بناء Prompt"}
                          </span>
                        </motion.button>

                        {formData.ai_prompt && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700 font-semibold">
                              تم بناء Prompt بنجاح
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-purple-500" />
                        استخدم أداة بناء الـ Prompt لإنشاء تعليمات احترافية مع
                        جدول معايير تقييم تفصيلي
                      </p>
                    </div>
                  </div>
                )}
                {(formData.field_type === "select" ||
                  formData.field_type === "radio") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        الخيارات المتاحة
                      </label>
                      {shouldShowWeights && (
                        <button
                          type="button"
                          onClick={() => {
                            const options = formData.options?.options || [];
                            const distributed = autoDistributeWeights(options);
                            setFormData({
                              ...formData,
                              options: {
                                ...formData.options,
                                options: distributed,
                              },
                            });
                          }}
                          className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold"
                        >
                          توزيع تلقائي
                        </button>
                      )}
                    </div>

                    {/* Weight Total Indicator - only show if 2+ options */}
                    {shouldShowWeights && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 rounded-xl p-4 space-y-3">
                        {/* Quick Presets */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700">
                            توزيع سريع:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {/* Generate preset buttons based on number of options */}
                            {formData.options?.options?.length === 2 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 500;
                                    newOptions[1].weight = 500;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  50% / 50%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 700;
                                    newOptions[1].weight = 300;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  70% / 30%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 300;
                                    newOptions[1].weight = 700;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  30% / 70%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 600;
                                    newOptions[1].weight = 400;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  60% / 40%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 800;
                                    newOptions[1].weight = 200;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  80% / 20%
                                </button>
                              </>
                            )}
                            {formData.options?.options?.length === 3 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 334;
                                    newOptions[1].weight = 333;
                                    newOptions[2].weight = 333;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  33% / 33% / 33%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 500;
                                    newOptions[1].weight = 300;
                                    newOptions[2].weight = 200;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  50% / 30% / 20%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 600;
                                    newOptions[1].weight = 300;
                                    newOptions[2].weight = 100;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  60% / 30% / 10%
                                </button>
                              </>
                            )}
                            {formData.options?.options?.length === 4 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 250;
                                    newOptions[1].weight = 250;
                                    newOptions[2].weight = 250;
                                    newOptions[3].weight = 250;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  25% متساوي
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 400;
                                    newOptions[1].weight = 300;
                                    newOptions[2].weight = 200;
                                    newOptions[3].weight = 100;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  40% / 30% / 20% / 10%
                                </button>
                              </>
                            )}
                            {formData.options?.options?.length === 5 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 200;
                                    newOptions[1].weight = 200;
                                    newOptions[2].weight = 200;
                                    newOptions[3].weight = 200;
                                    newOptions[4].weight = 200;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  20% متساوي
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[0].weight = 400;
                                    newOptions[1].weight = 300;
                                    newOptions[2].weight = 150;
                                    newOptions[3].weight = 100;
                                    newOptions[4].weight = 50;
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  تنازلي
                                </button>
                              </>
                            )}
                            {/* For 6+ options, show equal distribution and descending pattern */}
                            {formData.options?.options?.length >= 6 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    const equalWeight = Math.floor(
                                      1000 / newOptions.length
                                    );
                                    const remainder =
                                      1000 - equalWeight * newOptions.length;
                                    newOptions.forEach((opt, idx) => {
                                      opt.weight =
                                        equalWeight + (idx < remainder ? 1 : 0);
                                    });
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  توزيع متساوي (
                                  {Math.round(
                                    1000 /
                                      (formData.options?.options?.length || 1)
                                  ) / 10}
                                  %)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    // Create descending pattern
                                    const count = newOptions.length;
                                    const total = (count * (count + 1)) / 2; // Sum of 1+2+3+...+n
                                    newOptions.forEach((opt, idx) => {
                                      // Highest first, lowest last
                                      const multiplier = count - idx;
                                      opt.weight = Math.round(
                                        (multiplier / total) * 1000
                                      );
                                    });
                                    // Adjust for rounding errors
                                    const currentTotal = newOptions.reduce(
                                      (sum, opt) => sum + opt.weight,
                                      0
                                    );
                                    if (currentTotal !== 1000) {
                                      newOptions[0].weight +=
                                        1000 - currentTotal;
                                    }
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-[#2A3984] hover:text-white hover:border-[#2A3984] transition-colors"
                                >
                                  توزيع تنازلي
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            مجموع الأوزان:
                          </span>
                          <span
                            className={`text-2xl font-bold ${
                              isWeightValid ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {totalWeight}
                          </span>
                        </div>
                        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(totalWeight / 10, 100)}%`,
                            }}
                            className={`h-full rounded-full ${
                              isWeightValid
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : totalWeight > 1000
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-amber-500 to-amber-600"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          {isWeightValid ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              ممتاز! المجموع يساوي 1000
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              يجب أن يكون مجموع الأوزان = 100 بالضبط
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                      {(formData.options?.options || []).map(
                        (option: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white p-3 rounded-xl border-2 border-gray-200 hover:border-[#2A3984]/30 transition-all space-y-2"
                          >
                            <div className="flex gap-2 items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-[#2A3984]/10 text-[#2A3984] rounded-lg font-bold text-sm shrink-0">
                                {index + 1}
                              </div>
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...(formData.options?.options || []),
                                  ];
                                  newOptions[index].value = e.target.value;
                                  setFormData({
                                    ...formData,
                                    options: {
                                      ...formData.options,
                                      options: newOptions,
                                    },
                                  });
                                }}
                                placeholder="القيمة (value)"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all text-sm"
                              />
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...(formData.options?.options || []),
                                  ];
                                  newOptions[index].label = e.target.value;
                                  setFormData({
                                    ...formData,
                                    options: {
                                      ...formData.options,
                                      options: newOptions,
                                    },
                                  });
                                }}
                                placeholder="النص المعروض (label)"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A3984]/20 focus:border-[#2A3984] transition-all text-sm"
                              />
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  let newOptions = (
                                    formData.options?.options || []
                                  ).filter((_: any, i: number) => i !== index);

                                  // Auto-distribute weights after deletion
                                  newOptions =
                                    autoDistributeWeights(newOptions);

                                  setFormData({
                                    ...formData,
                                    options: {
                                      ...formData.options,
                                      options: newOptions,
                                    },
                                  });
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            </div>
                            {shouldShowWeights && (
                              <div className="flex items-center gap-3 pr-10">
                                <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                  الوزن:
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1000"
                                  value={option.weight ?? 0}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    newOptions[index].weight = parseInt(
                                      e.target.value
                                    );
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2A3984]"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  max="1000"
                                  value={option.weight ?? 0}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(formData.options?.options || []),
                                    ];
                                    const value = parseInt(e.target.value) || 0;
                                    newOptions[index].weight = Math.min(
                                      1000,
                                      Math.max(0, value)
                                    );
                                    setFormData({
                                      ...formData,
                                      options: {
                                        ...formData.options,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  className="w-20 h-8 px-2 text-center bg-[#2A3984] text-white text-sm font-bold rounded-lg border-2 border-[#2A3984] focus:outline-none focus:ring-2 focus:ring-[#2A3984]/50"
                                />
                              </div>
                            )}
                          </motion.div>
                        )
                      )}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          let newOptions = [
                            ...(formData.options?.options || []),
                            { value: "", label: "", weight: 0 },
                          ];

                          // Auto-distribute weights after adding
                          newOptions = autoDistributeWeights(newOptions);

                          setFormData({
                            ...formData,
                            options: {
                              ...formData.options,
                              options: newOptions,
                            },
                          });
                        }}
                        className="w-full px-4 py-3 bg-white border-2 border-dashed border-[#2A3984]/30 rounded-xl text-[#2A3984] font-semibold hover:bg-[#2A3984]/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        إضافة خيار جديد
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#2A3984]/5 to-[#2A3984]/10 rounded-xl border-2 border-[#2A3984]/20">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={formData.is_required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_required: e.target.checked,
                      })
                    }
                    className="w-6 h-6 text-[#2A3984] rounded-lg focus:ring-2 focus:ring-[#2A3984] cursor-pointer"
                  />
                  <label
                    htmlFor="is_required"
                    className="text-sm font-semibold text-[#2A3984] cursor-pointer flex-1"
                  >
                    هذا الحقل مطلوب (إجباري)
                  </label>
                  {/* <div
                    className={`p-1 rounded-lg ${
                      formData.is_required ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    {formData.is_required ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-white" />
                    )}
                  </div> */}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                >
                  إلغاء
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: !isSelectOrRadio || isWeightValid ? 1.05 : 1,
                    boxShadow:
                      !isSelectOrRadio || isWeightValid
                        ? "0 10px 30px rgba(42, 57, 132, 0.3)"
                        : undefined,
                  }}
                  whileTap={{
                    scale: !isSelectOrRadio || isWeightValid ? 0.95 : 1,
                  }}
                  onClick={handleSave}
                  disabled={isSelectOrRadio && !isWeightValid}
                  className={`px-8 py-3 rounded-xl font-bold shadow-xl transition-all flex items-center gap-2 ${
                    isSelectOrRadio && !isWeightValid
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white"
                  }`}
                >
                  <span>حفظ التغييرات</span>
                  <Save className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* AI Prompt Builder Modal */}
      <AIPromptBuilderModal
        isOpen={showAIPromptBuilder}
        onClose={() => setShowAIPromptBuilder(false)}
        initialPrompt={
          typeof formData?.ai_prompt === "object"
            ? JSON.stringify(formData.ai_prompt)
            : formData?.ai_prompt || ""
        }
        onSave={(promptData) => {
          if (formData) {
            setFormData({
              ...formData,
              ai_prompt: promptData,
            });
          }
        }}
        availableQuestions={allFields
          .filter(
            (f) => f.is_ai_calculated && f.ai_prompt && f.id !== formData?.id
          )
          .map((f) => ({
            id: f.id,
            label: f.label,
            ai_prompt:
              typeof f.ai_prompt === "object"
                ? JSON.stringify(f.ai_prompt)
                : f.ai_prompt || undefined,
          }))}
      />
    </AnimatePresence>
  );
}
