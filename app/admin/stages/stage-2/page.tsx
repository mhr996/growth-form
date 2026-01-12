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
import { FieldEditModalStage2 } from "@/components/field-edit-modal-stage2";

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
        layout
        className={`group bg-white rounded-xl border-2 p-4 transition-all ${
          isDragging
            ? "border-[#2A3984] shadow-2xl scale-105 opacity-50 z-50"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <button
            {...listeners}
            {...attributes}
            className={`mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing ${
              isDragging ? "cursor-grabbing" : ""
            }`}
            title="اسحب لتغيير الترتيب"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </button>

          {/* Field Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {field.label}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {field.field_type === "text" && "نص"}
                    {field.field_type === "email" && "بريد إلكتروني"}
                    {field.field_type === "tel" && "هاتف"}
                    {field.field_type === "number" && "رقم"}
                    {field.field_type === "select" && "قائمة منسدلة"}
                    {field.field_type === "radio" && "اختيار متعدد"}
                    {field.field_type === "textarea" && "نص طويل"}
                    {field.field_type === "date" && "تاريخ"}
                  </span>
                  {field.is_required && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                      مطلوب
                    </span>
                  )}
                  {field.has_weight &&
                    field.weight &&
                    !field.is_ai_calculated && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        الوزن: {field.weight}
                      </span>
                    )}
                  {field.is_ai_calculated && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      AI تقييم
                    </span>
                  )}
                </div>
                {field.question_title && (
                  <p className="text-sm text-gray-600 mt-1">
                    {field.question_title}
                  </p>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => onEdit(field)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
              </button>
            </div>

            {field.placeholder && (
              <p className="text-sm text-gray-500 mt-1">
                نائب: {field.placeholder}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Stage2Page() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .eq("stage", 2)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      console.error("Error loading fields:", error);
      setMessage({
        type: "error",
        text: "فشل تحميل الحقول",
      });
      setTimeout(() => setMessage(null), 3000);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setFields((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
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
        text: "تم حفظ الترتيب بنجاح",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving order:", error);
      setMessage({
        type: "error",
        text: "فشل حفظ الترتيب",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldUpdate = async (updatedField: FormField) => {
    await loadFields();
    setEditingField(null);
    setMessage({
      type: "success",
      text: "تم تحديث الحقل بنجاح",
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const activeField = fields.find((f) => f.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2A3984]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-6">
          حقول المرحلة الثانية
        </h1>
        <p className="text-gray-600">
          قم بترتيب وتعديل حقول النموذج للمرحلة الثانية
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

      {/* Save Button */}
      <div className="mb-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveOrder}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? "جاري الحفظ..." : "حفظ الترتيب"}</span>
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
          <div className="space-y-3">
            {fields.map((field, index) => {
              const showDropIndicatorAbove =
                overId === field.id &&
                activeId !== null &&
                fields.findIndex((f) => f.id === activeId) > index;
              const showDropIndicatorBelow =
                overId === field.id &&
                activeId !== null &&
                fields.findIndex((f) => f.id === activeId) < index;

              return (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={setEditingField}
                  showDropIndicatorAbove={!!showDropIndicatorAbove}
                  showDropIndicatorBelow={!!showDropIndicatorBelow}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeField && (
            <div className="bg-white rounded-xl border-2 border-[#2A3984] p-4 shadow-2xl opacity-90">
              <div className="flex items-start gap-4">
                <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {activeField.label}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Field Edit Modal */}
      <FieldEditModalStage2
        isOpen={!!editingField}
        field={editingField}
        onClose={() => setEditingField(null)}
        onUpdate={handleFieldUpdate}
      />
    </div>
  );
}
