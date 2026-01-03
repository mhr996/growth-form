"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CustomDropdown } from "./custom-dropdown";

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
  full_width?: boolean;
  is_ai_calculated?: boolean;
}

interface DynamicFieldProps {
  field: FormFieldData;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  userEmail?: string;
  formValues: Record<string, any>;
}

export function DynamicFormField({
  field,
  value,
  onChange,
  error,
  userEmail,
  formValues,
}: DynamicFieldProps) {
  const supabase = createClient();
  const [wordCount, setWordCount] = useState(0);

  // Calculate word count for textarea fields
  useEffect(() => {
    if (field.field_type === "textarea" && value) {
      const words = value
        .trim()
        .split(/\s+/)
        .filter((word: string) => word.length > 0);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [value, field.field_type]);

  // Auto-fill email if this is the email field
  useEffect(() => {
    if (field.field_name === "email" && userEmail && !value) {
      onChange(userEmail);
    }
  }, [field.field_name, userEmail, value]);

  // Auto-fill default value for select fields
  useEffect(() => {
    const defaultValue = field.validation_rules?.default;
    if (field.field_type === "select" && defaultValue && !value) {
      onChange(defaultValue);
    }
  }, [field.field_type, field.validation_rules?.default, value]);

  const isDisabled =
    field.validation_rules?.disabled ||
    (field.field_name === "email" && field.validation_rules?.autoFilled);

  const baseInputClasses = `
    w-full px-5 py-4 rounded-xl border-2 bg-white
    transition-all duration-300 text-base
    placeholder:text-gray-400
    focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10
    hover:border-gray-300
    leading-normal
    ${
      error
        ? "border-red-400 animate-[shake_0.3s_ease-in-out]"
        : "border-gray-200"
    }
    ${isDisabled ? "bg-gray-50 cursor-not-allowed" : ""}
  `;

  const renderField = () => {
    switch (field.field_type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            type={field.field_type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            disabled={isDisabled}
            required={field.is_required}
            className={baseInputClasses}
          />
        );

      case "select":
        const options = field.options?.options || [];

        return (
          <CustomDropdown
            options={options}
            value={value || ""}
            onChange={onChange}
            placeholder={field.placeholder || "اختر..."}
            disabled={isDisabled}
            error={!!error}
            required={field.is_required}
          />
        );

      case "radio":
        const radioOptions = field.options?.options || [];
        return (
          <div className="grid grid-cols-2 gap-3">
            {radioOptions.map((opt: any) => (
              <motion.label
                key={opt.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${
                    value === opt.value
                      ? "border-[#2A3984] bg-gradient-to-br from-[#2A3984]/5 to-[#2A3984]/10"
                      : "border-gray-200 hover:border-[#2A3984]/50"
                  }
                `}
              >
                <input
                  type="radio"
                  name={field.field_name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  required={field.is_required}
                  className="w-5 h-5 text-[#2A3984] focus:ring-[#2A3984]"
                />
                <span
                  className={`font-medium ${
                    value === opt.value ? "text-[#2A3984]" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </span>
              </motion.label>
            ))}
          </div>
        );

      case "textarea":
        const maxWords = field.validation_rules?.maxWords;
        return (
          <div className="space-y-2">
            <textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || ""}
              disabled={isDisabled}
              required={field.is_required}
              rows={6}
              className={`${baseInputClasses} resize-none`}
            />
            {maxWords && (
              <div className="flex justify-end">
                <span
                  className={`text-xs font-medium ${
                    wordCount > maxWords ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {wordCount} / {maxWords} كلمة
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-semibold text-gray-700">
          {field.label}
          {field.is_required && <span className="text-red-500 mr-1">*</span>}
        </label>
        {field.tooltip && (
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-2xl border border-white/10">
              <div className="whitespace-pre-line leading-relaxed">
                {field.tooltip}
              </div>
              {/* Arrow pointing down */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
      {renderField()}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
