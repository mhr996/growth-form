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
} from "lucide-react";
import { useState, useEffect } from "react";

interface FieldEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
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
  is_ai_calculated?: boolean;
  full_width?: boolean;
}

export function FieldEditModal({
  isOpen,
  onClose,
  field,
  onSave,
}: FieldEditModalProps) {
  const [formData, setFormData] = useState<FormField | null>(null);

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
    }
  }, [field]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
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

                {/* Weight */}
                {!formData.is_ai_calculated && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      الوزن / الأهمية{" "}
                      <span className="text-gray-400 font-normal">(1-10)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.weight || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weight: parseInt(e.target.value),
                          })
                        }
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2A3984]"
                      />
                      <div className="w-16 h-12 flex items-center justify-center bg-[#2A3984] text-white text-xl font-bold rounded-xl shadow-lg">
                        {formData.weight || 1}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      يستخدم لتحديد أهمية الحقل في التقييم (1 = أقل أهمية، 10 =
                      أعلى أهمية)
                    </p>
                  </div>
                )}
                {formData.is_ai_calculated && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">
                        هذا السؤال يتم تقييمه بواسطة الذكاء الاصطناعي
                      </span>
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      لا يمكن تعيين وزن يدوي لهذا الحقل حيث سيتم حسابه تلقائياً
                    </p>
                  </div>
                )}
                {(formData.field_type === "select" ||
                  formData.field_type === "radio") && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      الخيارات المتاحة
                    </label>
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
                                  const newOptions = (
                                    formData.options?.options || []
                                  ).filter((_: any, i: number) => i !== index);
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
                            <div className="flex items-center gap-3 pr-10">
                              <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                الوزن:
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={option.weight || 1}
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
                              <div className="w-10 h-8 flex items-center justify-center bg-[#2A3984] text-white text-sm font-bold rounded-lg">
                                {option.weight || 1}
                              </div>
                            </div>
                          </motion.div>
                        )
                      )}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const newOptions = [
                            ...(formData.options?.options || []),
                            { value: "", label: "", weight: 1 },
                          ];
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
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(42, 57, 132, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-xl transition-all flex items-center gap-2"
                >
                  <span>حفظ التغييرات</span>
                  <Save className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
