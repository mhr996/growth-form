"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Download,
  Eye,
  Edit3,
  Copy,
  Check,
} from "lucide-react";

type TableCell = {
  id: string;
  value: string;
};

type TableRow = {
  id: string;
  cells: TableCell[];
};

type TableData = {
  headers: string[];
  rows: TableRow[];
};

type PromptData = {
  instruction: string;
  context?: string;
  rubric?: TableData;
  examples?: string;
};

interface AIPromptBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onSave: (promptData: any) => void;
  availableQuestions?: Array<{ id: string; label: string; ai_prompt?: string }>;
}

export function AIPromptBuilderModal({
  isOpen,
  onClose,
  initialPrompt,
  onSave,
  availableQuestions = [],
}: AIPromptBuilderModalProps) {
  const [instruction, setInstruction] = useState("");
  const [context, setContext] = useState("");
  const [examples, setExamples] = useState("");
  const [tableData, setTableData] = useState<TableData>({
    headers: ["المعيار", "الوصف", "النقاط"],
    rows: [
      {
        id: "1",
        cells: [
          { id: "1-1", value: "" },
          { id: "1-2", value: "" },
          { id: "1-3", value: "" },
        ],
      },
    ],
  });
  const [copied, setCopied] = useState(false);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        try {
          const parsed: PromptData = JSON.parse(initialPrompt);
          setInstruction(
            parsed.instruction && parsed.instruction !== "null"
              ? parsed.instruction
              : ""
          );
          setContext(
            parsed.context && parsed.context !== "null" ? parsed.context : ""
          );
          setExamples(
            parsed.examples && parsed.examples !== "null" ? parsed.examples : ""
          );
          if (parsed.rubric) {
            setTableData(parsed.rubric);
          } else {
            // Reset table if no rubric in the prompt
            setTableData({
              headers: ["المعيار", "الوصف", "النقاط"],
              rows: [
                {
                  id: "1",
                  cells: [
                    { id: "1-1", value: "" },
                    { id: "1-2", value: "" },
                    { id: "1-3", value: "" },
                  ],
                },
              ],
            });
          }
        } catch (e) {
          // If not JSON, treat as plain text instruction
          setInstruction(initialPrompt !== "null" ? initialPrompt : "");
          setContext("");
          setExamples("");
          setTableData({
            headers: ["المعيار", "الوصف", "النقاط"],
            rows: [
              {
                id: "1",
                cells: [
                  { id: "1-1", value: "" },
                  { id: "1-2", value: "" },
                  { id: "1-3", value: "" },
                ],
              },
            ],
          });
        }
      } else {
        // No initial prompt - reset everything
        setInstruction("");
        setContext("");
        setExamples("");
        setTableData({
          headers: ["المعيار", "الوصف", "النقاط"],
          rows: [
            {
              id: "1",
              cells: [
                { id: "1-1", value: "" },
                { id: "1-2", value: "" },
                { id: "1-3", value: "" },
              ],
            },
          ],
        });
      }
      setCopied(false);
    }
  }, [isOpen, initialPrompt]);

  const generateJSON = (): PromptData => {
    const prompt: PromptData = {
      instruction,
    };

    if (context) prompt.context = context;
    if (
      tableData.rows.length > 0 &&
      tableData.rows.some((row) => row.cells.some((cell) => cell.value))
    ) {
      prompt.rubric = tableData;
    }
    if (examples) prompt.examples = examples;

    return prompt;
  };

  const jsonOutput = JSON.stringify(generateJSON(), null, 2);

  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now().toString(),
      cells: tableData.headers.map((_, idx) => ({
        id: `${Date.now()}-${idx}`,
        value: "",
      })),
    };
    setTableData({ ...tableData, rows: [...tableData.rows, newRow] });
  };

  const removeRow = (rowId: string) => {
    setTableData({
      ...tableData,
      rows: tableData.rows.filter((row) => row.id !== rowId),
    });
  };

  const addColumn = () => {
    const newHeader = `عمود ${tableData.headers.length + 1}`;
    setTableData({
      headers: [...tableData.headers, newHeader],
      rows: tableData.rows.map((row) => ({
        ...row,
        cells: [...row.cells, { id: `${row.id}-${Date.now()}`, value: "" }],
      })),
    });
  };

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 1) return;
    setTableData({
      headers: tableData.headers.filter((_, idx) => idx !== index),
      rows: tableData.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, idx) => idx !== index),
      })),
    });
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[index] = value;
    setTableData({ ...tableData, headers: newHeaders });
  };

  const updateCell = (rowId: string, cellId: string, value: string) => {
    setTableData({
      ...tableData,
      rows: tableData.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cells: row.cells.map((cell) =>
                cell.id === cellId ? { ...cell, value } : cell
              ),
            }
          : row
      ),
    });
  };

  const importFromQuestion = (questionId: string) => {
    const question = availableQuestions.find((q) => q.id === questionId);
    if (question?.ai_prompt) {
      try {
        const parsed: PromptData = JSON.parse(question.ai_prompt);
        if (parsed.rubric) {
          setTableData(parsed.rubric);
        }
      } catch (e) {
        console.error("Failed to import table:", e);
      }
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // Use the same logic as generateJSON to ensure consistency
    const promptData = generateJSON();
    onSave(promptData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                بناء Prompt الذكاء الاصطناعي
              </h2>
              <p className="text-white/80 text-sm">
                قم ببناء prompt احترافي مع جدول تقييم تفصيلي
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Right Side - Editor & Table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Instruction Section */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  التعليمات الأساسية (Instruction)
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                  placeholder="مثال: قيّم إجابة المتقدم على السؤال التالي بناءً على معايير التقييم المحددة..."
                />
              </div>

              {/* Context Section */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  السياق (Context)
                  <span className="text-gray-400 text-xs font-normal">
                    اختياري
                  </span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="معلومات إضافية أو سياق يساعد الذكاء الاصطناعي على فهم السؤال بشكل أفضل..."
                />
              </div>

              {/* Rubric Table Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    جدول معايير التقييم (Rubric)
                  </label>
                  <div className="flex gap-2">
                    {availableQuestions.length > 0 && (
                      <select
                        onChange={(e) => importFromQuestion(e.target.value)}
                        className="text-xs px-3 py-1.5 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
                      >
                        <option value="">استيراد من سؤال آخر</option>
                        {availableQuestions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addColumn}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      عمود
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addRow}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      صف
                    </motion.button>
                  </div>
                </div>

                {/* Table */}
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          {tableData.headers.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-right relative group"
                            >
                              <input
                                type="text"
                                value={header}
                                onChange={(e) =>
                                  updateHeader(idx, e.target.value)
                                }
                                className="w-full bg-transparent border-0 focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 font-bold text-sm text-gray-900"
                              />
                              {tableData.headers.length > 1 && (
                                <button
                                  onClick={() => removeColumn(idx)}
                                  className="absolute top-0 -left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </th>
                          ))}
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tableData.rows.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            {row.cells.map((cell, idx) => (
                              <td key={cell.id} className="px-4 py-3">
                                <input
                                  type="text"
                                  value={cell.value}
                                  onChange={(e) =>
                                    updateCell(row.id, cell.id, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                                  placeholder={`${tableData.headers[idx]}...`}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeRow(row.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Examples Section */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  أمثلة (Examples)
                  <span className="text-gray-400 text-xs font-normal">
                    اختياري
                  </span>
                </label>
                <textarea
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  placeholder="أمثلة على إجابات وتقييماتها لمساعدة الذكاء الاصطناعي..."
                />
              </div>
            </div>

            {/* Left Side - JSON Preview */}
            <div className="w-96 bg-gradient-to-br from-gray-900 to-gray-800 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    معاينة JSON
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
                <pre className="text-xs text-green-400 font-mono bg-black/30 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-words">
                  {jsonOutput}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              سيتم حفظ البيانات بصيغة JSON وإرسالها للذكاء الاصطناعي
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                حفظ Prompt
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
