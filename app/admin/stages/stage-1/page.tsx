"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Edit,
  Save,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FieldEditModal } from "@/components/field-edit-modal";

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
  question_title?: string | null;
  ai_prompt?: string | null;
}

function SortableField({
  field,
  onEdit,
  showDropIndicatorAbove,
  showDropIndicatorBelow,
}: {
  field: FormField;
  onEdit: (field: FormField) => void;
  showDropIndicatorAbove?: boolean;
  showDropIndicatorBelow?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="relative">
      {/* Drop Indicator - appears above the element */}
      {showDropIndicatorAbove && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          className="absolute -top-1.5 left-0 right-0 z-10 flex items-center"
        >
          <div className="flex-1 h-1 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] rounded-full shadow-lg"></div>
          <div className="absolute left-0 w-3 h-3 bg-[#2A3984] rounded-full -translate-x-1/2 ring-4 ring-white"></div>
          <div className="absolute right-0 w-3 h-3 bg-[#3a4a9f] rounded-full translate-x-1/2 ring-4 ring-white"></div>
        </motion.div>
      )}

      {/* Drop Indicator - appears below the element */}
      {showDropIndicatorBelow && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          className="absolute -bottom-1.5 left-0 right-0 z-10 flex items-center"
        >
          <div className="flex-1 h-1 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] rounded-full shadow-lg"></div>
          <div className="absolute left-0 w-3 h-3 bg-[#2A3984] rounded-full -translate-x-1/2 ring-4 ring-white"></div>
          <div className="absolute right-0 w-3 h-3 bg-[#3a4a9f] rounded-full translate-x-1/2 ring-4 ring-white"></div>
        </motion.div>
      )}

      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-white rounded-2xl border-2 p-5 mb-3
          transition-all duration-200
          ${
            isDragging
              ? "opacity-30 border-gray-200"
              : "border-gray-200 hover:border-[#2A3984]/40 hover:shadow-xl"
          }
        `}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2.5 hover:bg-gradient-to-r hover:from-[#2A3984]/10 hover:to-[#3a4a9f]/10 rounded-xl transition-all mt-1"
          >
            <GripVertical className="w-6 h-6 text-gray-400" />
          </div>

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            {field.question_title && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 rounded-lg font-bold border border-amber-500/30">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                  {field.question_title}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-bold text-lg text-gray-900">{field.label}</h3>
              {field.is_required && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  مطلوب
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gradient-to-r from-[#2A3984]/10 to-[#3a4a9f]/10 text-[#2A3984] rounded-full font-semibold border border-[#2A3984]/20">
                {field.field_type}
              </span>
            </div>

            {field.placeholder && (
              <div className="mb-2">
                <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                  {field.placeholder}
                </p>
              </div>
            )}

            {field.tooltip && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-gradient-to-r from-green-50 to-green-50 rounded-xl border border-green-200/90">
                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700 leading-relaxed">
                  {field.tooltip}
                </p>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(field)}
            className="p-3.5 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl hover:shadow-xl transition-all shadow-lg"
          >
            <Edit className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Stage1Page() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load fields from database
  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .eq("stage", 1)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
      setMessage({
        type: "error",
        text: "فشل تحميل الحقول. تأكد من إنشاء الجدول في Supabase.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleEdit = (field: FormField) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleSaveField = async (updatedField: FormField) => {
    try {
      const { error } = await supabase
        .from("form_fields")
        .update({
          label: updatedField.label,
          placeholder: updatedField.placeholder,
          tooltip: updatedField.tooltip,
          is_required: updatedField.is_required,
        })
        .eq("id", updatedField.id);

      if (error) throw error;

      setFields((prev) =>
        prev.map((f) => (f.id === updatedField.id ? updatedField : f))
      );

      setMessage({
        type: "success",
        text: "تم حفظ التغييرات بنجاح!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving field:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ التغييرات. حاول مرة أخرى.",
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);

      // Update display_order for all fields
      const updates = fields.map((field, index) => ({
        id: field.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("form_fields")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "تم حفظ الترتيب بنجاح!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving order:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ الترتيب. حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-[#2A3984]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mt-8">
      {/* Header */}
      <div className="mb-8 opacity-0 animate-[slideDown_0.4s_ease-out_forwards]">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          إدارة المرحلة الأولى
        </h1>
        <p className="text-gray-600">
          قم بتعديل حقول النموذج، إضافة تلميحات، وإعادة ترتيبها بسحبها وإفلاتها
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
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveOrder}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ الترتيب</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadFields}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span>إعادة تحميل</span>
        </motion.button>
      </div>

      {/* Fields List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {fields.map((field, index) => {
              const isDraggingThis = activeId === field.id;
              const isOverThis = overId === field.id && !isDraggingThis;

              // Determine drag direction
              let showAbove = false;
              let showBelow = false;

              if (isOverThis && activeId) {
                const activeIndex = fields.findIndex((f) => f.id === activeId);
                const overIndex = index;

                // If dragging down (from lower index to higher), show below
                // If dragging up (from higher index to lower), show above
                if (activeIndex < overIndex) {
                  showBelow = true;
                } else {
                  showAbove = true;
                }
              }

              return (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={handleEdit}
                  showDropIndicatorAbove={showAbove}
                  showDropIndicatorBelow={showBelow}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-xl border-2 border-[#2A3984] p-4 shadow-2xl cursor-grabbing opacity-90">
              <div className="flex items-center gap-4">
                <div className="p-2">
                  <GripVertical className="w-5 h-5 text-[#2A3984]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">
                      {fields.find((f) => f.id === activeId)?.label}
                    </h3>
                    {fields.find((f) => f.id === activeId)?.is_required && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                        مطلوب
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                      {fields.find((f) => f.id === activeId)?.field_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500" dir="ltr">
                    {fields.find((f) => f.id === activeId)?.field_name}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {fields.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
        >
          <p className="text-gray-500">
            لا توجد حقول. تأكد من تشغيل سكريبت SQL في Supabase.
          </p>
        </motion.div>
      )}

      {/* Edit Modal */}
      <FieldEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        field={editingField}
        onSave={handleSaveField}
      />
    </div>
  );
}
