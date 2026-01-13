"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DynamicFormField } from "@/components/dynamic-form-field";
import { createClient } from "@/lib/supabase/client";

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

export default function TestStage3Page() {
  const [formFields, setFormFields] = useState<FormFieldData[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("form_fields")
      .select("*")
      .eq("stage", 3)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setFormFields(data);
    }
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    formFields.forEach((field) => {
      const value = formValues[field.field_name];

      if (field.is_required && !value) {
        errors[field.field_name] = `${field.label} مطلوب`;
        return;
      }

      if (value && field.validation_rules) {
        const rules = field.validation_rules;

        if (rules.minLength && value.length < rules.minLength) {
          errors[
            field.field_name
          ] = `${field.label} يجب أن يكون ${rules.minLength} أحرف على الأقل`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors[
            field.field_name
          ] = `${field.label} يجب أن يكون ${rules.maxLength} أحرف على الأكثر`;
        }

        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            errors[field.field_name] =
              rules.message || `${field.label} غير صحيح`;
          }
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Stage 3 Form Values:", formValues);
    alert("تم إرسال النموذج بنجاح! (وضع الاختبار)");

    setSubmitting(false);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (formErrors[fieldName]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="https://ansjlhmmbkmytgkjpqie.supabase.co/storage/v1/object/public/images/logo.webp"
              alt="logo"
              width={200}
              height={80}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            اختبار المرحلة 3
          </h1>
          <p className="text-gray-600">التحدي الريادي - وضع الاختبار</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.map((field) => (
                  <div
                    key={field.id}
                    className={field.full_width ? "md:col-span-2" : ""}
                  >
                    <DynamicFormField
                      field={field}
                      value={formValues[field.field_name]}
                      error={formErrors[field.field_name]}
                      onChange={(value) =>
                        handleFieldChange(field.field_name, value)
                      }
                      formValues={formValues}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.05 }}
                  whileTap={{ scale: submitting ? 1 : 0.95 }}
                  className="px-12 py-4 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال"}
                </motion.button>
              </div>
            </form>

            {/* Debug Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                عدد الحقول: {formFields.length} | القيم المدخلة:{" "}
                {Object.keys(formValues).length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
