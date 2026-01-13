"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  MessageSquare,
  UserPlus,
  Send,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Invitee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  invited_at: string | null;
  email_sent: boolean;
  whatsapp_sent: boolean;
  created_at: string;
}

interface InvitationSettings {
  id: string;
  email_subject: string;
  email_content: string;
  whatsapp_template: string;
  whatsapp_image: string | null;
}

export default function InvitationsPage() {
  const [activeTab, setActiveTab] = useState<"content" | "invitees">("content");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<Set<string>>(
    new Set()
  );
  const [settings, setSettings] = useState<InvitationSettings>({
    id: "",
    email_subject: "",
    email_content: "",
    whatsapp_template: "",
    whatsapp_image: null,
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
    emailsSent: 0,
    whatsappsSent: 0,
    errors: [] as string[],
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newInvitee, setNewInvitee] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
    loadInvitees();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("invitation_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadInvitees = async () => {
    try {
      setLoading(true);
      const pageSize = 1000; // Supabase default max rows per request
      let offset = 0;
      let all: Invitee[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("invitees")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const batch = data || [];
        all = all.concat(batch);

        if (batch.length < pageSize) break;
        offset += pageSize;
      }

      setInvitees(all);
    } catch (error) {
      console.error("Error loading invitees:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("invitation_settings")
        .update({
          email_subject: settings.email_subject,
          email_content: settings.email_content,
          whatsapp_template: settings.whatsapp_template,
          whatsapp_image: settings.whatsapp_image,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;
      alert("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const addInvitee = async () => {
    if (!newInvitee.name || (!newInvitee.email && !newInvitee.phone)) {
      alert(
        "الرجاء إدخال الاسم وإما البريد الإلكتروني أو رقم الهاتف على الأقل"
      );
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("invitees").insert({
        name: newInvitee.name,
        email: newInvitee.email || null,
        phone: newInvitee.phone || null,
        city: newInvitee.city || null,
      });

      if (error) throw error;

      setNewInvitee({ name: "", email: "", phone: "", city: "" });
      setShowAddModal(false);
      loadInvitees();
    } catch (error) {
      console.error("Error adding invitee:", error);
      alert("حدث خطأ أثناء إضافة المدعو");
    } finally {
      setLoading(false);
    }
  };

  const updateInvitee = async () => {
    if (!editingInvitee) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("invitees")
        .update({
          name: editingInvitee.name,
          email: editingInvitee.email || null,
          phone: editingInvitee.phone || null,
          city: editingInvitee.city || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingInvitee.id);

      if (error) throw error;

      setEditingInvitee(null);
      loadInvitees();
    } catch (error) {
      console.error("Error updating invitee:", error);
      alert("حدث خطأ أثناء تحديث المدعو");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitee = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المدعو؟")) return;

    try {
      const { error } = await supabase.from("invitees").delete().eq("id", id);
      if (error) throw error;
      loadInvitees();
    } catch (error) {
      console.error("Error deleting invitee:", error);
      alert("حدث خطأ أثناء حذف المدعو");
    }
  };

  const toggleSelectAll = () => {
    const filteredInvitees = invitees.filter((invitee) => {
      const query = searchQuery.toLowerCase();
      return (
        invitee.name.toLowerCase().includes(query) ||
        invitee.email?.toLowerCase().includes(query) ||
        invitee.phone?.toLowerCase().includes(query) ||
        invitee.city?.toLowerCase().includes(query)
      );
    });

    const allFilteredSelected = filteredInvitees.every((inv) =>
      selectedInvitees.has(inv.id)
    );

    if (allFilteredSelected && filteredInvitees.length > 0) {
      // Deselect all filtered items
      const newSelected = new Set(selectedInvitees);
      filteredInvitees.forEach((inv) => newSelected.delete(inv.id));
      setSelectedInvitees(newSelected);
    } else {
      // Select all filtered items
      const newSelected = new Set(selectedInvitees);
      filteredInvitees.forEach((inv) => newSelected.add(inv.id));
      setSelectedInvitees(newSelected);
    }
  };

  const toggleSelectInvitee = (id: string) => {
    const newSelected = new Set(selectedInvitees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvitees(newSelected);
  };

  const sendInvitations = async () => {
    if (selectedInvitees.size === 0) {
      alert("الرجاء اختيار مدعوين على الأقل");
      return;
    }

    if (
      !confirm(
        `هل تريد إرسال الدعوات إلى ${selectedInvitees.size} شخص؟\n\nقد يستغرق هذا عدة دقائق حسب عدد المدعوين.`
      )
    ) {
      return;
    }

    try {
      setSending(true);
      setShowProgressModal(true);

      // Verify user is authenticated before sending
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert("جلستك انتهت. الرجاء تسجيل الدخول مرة أخرى.");
        setSending(false);
        setShowProgressModal(false);
        return;
      }

      const selectedInviteesList = invitees.filter((inv) =>
        selectedInvitees.has(inv.id)
      );

      // Initialize progress
      setSendingProgress({
        current: 0,
        total: selectedInviteesList.length,
        emailsSent: 0,
        whatsappsSent: 0,
        errors: [],
      });

      // Process in batches of 50
      const BATCH_SIZE = 50;
      const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
      let totalEmailsSent = 0;
      let totalWhatsappsSent = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < selectedInviteesList.length; i += BATCH_SIZE) {
        const batch = selectedInviteesList.slice(i, i + BATCH_SIZE);

        const response = await fetch("/api/send-invitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            invitees: batch,
            settings,
          }),
        });

        const result = await response.json();

        if (response.status === 401) {
          alert("غير مصرح. الرجاء تسجيل الدخول مرة أخرى.");
          setSending(false);
          setShowProgressModal(false);
          return;
        }

        if (result.success) {
          totalEmailsSent += result.emailsSent || 0;
          totalWhatsappsSent += result.whatsappsSent || 0;
          if (result.errors) {
            allErrors.push(...result.errors);
          }
        }

        // Update progress
        setSendingProgress({
          current: Math.min(i + BATCH_SIZE, selectedInviteesList.length),
          total: selectedInviteesList.length,
          emailsSent: totalEmailsSent,
          whatsappsSent: totalWhatsappsSent,
          errors: allErrors,
        });

        // Wait before next batch (unless it's the last batch)
        if (i + BATCH_SIZE < selectedInviteesList.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES)
          );
        }
      }

      // Show final results
      alert(
        `تم إرسال الدعوات بنجاح!\n\nإيميلات: ${totalEmailsSent}\nواتساب: ${totalWhatsappsSent}${
          allErrors.length > 0 ? `\n\nأخطاء: ${allErrors.length}` : ""
        }`
      );
      setSelectedInvitees(new Set());
      loadInvitees();
    } catch (error) {
      console.error("Error sending invitations:", error);
      alert("حدث خطأ أثناء إرسال الدعوات");
    } finally {
      setSending(false);
      setShowProgressModal(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      invitees.map((inv) => ({
        الاسم: inv.name,
        "البريد الإلكتروني": inv.email || "",
        "رقم الهاتف": inv.phone || "",
        المدينة: inv.city || "",
        "تم الدعوة": inv.invited_at ? "نعم" : "لا",
        "إيميل مرسل": inv.email_sent ? "نعم" : "لا",
        "واتساب مرسل": inv.whatsapp_sent ? "نعم" : "لا",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المدعوين");
    XLSX.writeFile(workbook, "invitees.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            إدارة الدعوات
          </h1>
          <p className="text-gray-600">
            إرسال دعوات التسجيل عبر البريد الإلكتروني والواتساب
          </p>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "content"
                ? "text-[#2A3984] border-b-2 border-[#2A3984]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              محتوى الدعوة
            </div>
          </button>
          <button
            onClick={() => setActiveTab("invitees")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "invitees"
                ? "text-[#2A3984] border-b-2 border-[#2A3984]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              المدعوين ({invitees.length})
            </div>
          </button>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === "content" ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="space-y-6">
                {/* Email Settings */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-[#2A3984]" />
                    إعدادات البريد الإلكتروني
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        عنوان البريد
                      </label>
                      <input
                        type="text"
                        value={settings.email_subject}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            email_subject: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        محتوى البريد
                      </label>
                      <textarea
                        value={settings.email_content}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            email_content: e.target.value,
                          })
                        }
                        rows={10}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-6"></div>

                {/* WhatsApp Settings */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    إعدادات الواتساب
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        اسم القالب (Template Name)
                      </label>
                      <input
                        type="text"
                        value={settings.whatsapp_template}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsapp_template: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                        placeholder="template_invitation"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        سيتم إضافة _m للذكور و _f للإناث تلقائياً (مثال:
                        template_invitation_m و template_invitation_f)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        رابط الصورة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={settings.whatsapp_image || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsapp_image: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        رابط الصورة في القالب (سيتم استخدام اسم المدعو تلقائياً
                        كمعامل أول)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="invitees"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {" "}
                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="ابحث عن اسم، بريد إلكتروني، رقم هاتف أو مدينة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3984] focus:border-transparent text-right"
                  />
                  {searchQuery && (
                    <div className="text-sm text-gray-600 mt-2">
                      عرض{" "}
                      {
                        invitees.filter((invitee) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            invitee.name.toLowerCase().includes(query) ||
                            invitee.email?.toLowerCase().includes(query) ||
                            invitee.phone?.toLowerCase().includes(query) ||
                            invitee.city?.toLowerCase().includes(query)
                          );
                        }).length
                      }{" "}
                      من {invitees.length} مدعو
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      إضافة مدعو
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      تصدير Excel
                    </button>
                  </div>

                  <button
                    onClick={sendInvitations}
                    disabled={sending || selectedInvitees.size === 0}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    إرسال الدعوات ({selectedInvitees.size})
                  </button>
                </div>
              </div>

              {/* Invitees Table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-right">
                          <input
                            type="checkbox"
                            checked={
                              invitees.filter((invitee) => {
                                const query = searchQuery.toLowerCase();
                                return (
                                  invitee.name.toLowerCase().includes(query) ||
                                  invitee.email
                                    ?.toLowerCase()
                                    .includes(query) ||
                                  invitee.phone
                                    ?.toLowerCase()
                                    .includes(query) ||
                                  invitee.city?.toLowerCase().includes(query)
                                );
                              }).length > 0 &&
                              invitees
                                .filter((invitee) => {
                                  const query = searchQuery.toLowerCase();
                                  return (
                                    invitee.name
                                      .toLowerCase()
                                      .includes(query) ||
                                    invitee.email
                                      ?.toLowerCase()
                                      .includes(query) ||
                                    invitee.phone
                                      ?.toLowerCase()
                                      .includes(query) ||
                                    invitee.city?.toLowerCase().includes(query)
                                  );
                                })
                                .every((invitee) =>
                                  selectedInvitees.has(invitee.id)
                                )
                            }
                            onChange={toggleSelectAll}
                            className="w-5 h-5 text-[#2A3984] rounded focus:ring-[#2A3984]"
                          />
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          الاسم
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          البريد الإلكتروني
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          رقم الهاتف
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          المدينة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          الحالة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2A3984]" />
                          </td>
                        </tr>
                      ) : invitees.filter((invitee) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            invitee.name.toLowerCase().includes(query) ||
                            invitee.email?.toLowerCase().includes(query) ||
                            invitee.phone?.toLowerCase().includes(query) ||
                            invitee.city?.toLowerCase().includes(query)
                          );
                        }).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            {searchQuery
                              ? "لا توجد نتائج للبحث"
                              : "لا يوجد مدعوين. قم بإضافة مدعوين جدد."}
                          </td>
                        </tr>
                      ) : (
                        invitees
                          .filter((invitee) => {
                            const query = searchQuery.toLowerCase();
                            return (
                              invitee.name.toLowerCase().includes(query) ||
                              invitee.email?.toLowerCase().includes(query) ||
                              invitee.phone?.toLowerCase().includes(query) ||
                              invitee.city?.toLowerCase().includes(query)
                            );
                          })
                          .map((invitee) => (
                            <tr
                              key={invitee.id}
                              className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedInvitees.has(invitee.id)}
                                  onChange={() =>
                                    toggleSelectInvitee(invitee.id)
                                  }
                                  className="w-5 h-5 text-[#2A3984] rounded focus:ring-[#2A3984]"
                                />
                              </td>
                              <td className="px-6 py-4">
                                {editingInvitee?.id === invitee.id ? (
                                  <input
                                    type="text"
                                    value={editingInvitee.name}
                                    onChange={(e) =>
                                      setEditingInvitee({
                                        ...editingInvitee,
                                        name: e.target.value,
                                      })
                                    }
                                    className="px-3 py-2 border-2 border-[#2A3984] rounded-lg w-full"
                                  />
                                ) : (
                                  <span className="font-medium text-gray-800">
                                    {invitee.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {editingInvitee?.id === invitee.id ? (
                                  <input
                                    type="email"
                                    value={editingInvitee.email || ""}
                                    onChange={(e) =>
                                      setEditingInvitee({
                                        ...editingInvitee,
                                        email: e.target.value,
                                      })
                                    }
                                    className="px-3 py-2 border-2 border-[#2A3984] rounded-lg w-full"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {invitee.email || "-"}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {editingInvitee?.id === invitee.id ? (
                                  <input
                                    type="tel"
                                    value={editingInvitee.phone || ""}
                                    onChange={(e) =>
                                      setEditingInvitee({
                                        ...editingInvitee,
                                        phone: e.target.value,
                                      })
                                    }
                                    className="px-3 py-2 border-2 border-[#2A3984] rounded-lg w-full"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {invitee.phone || "-"}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {editingInvitee?.id === invitee.id ? (
                                  <input
                                    type="text"
                                    value={editingInvitee.city || ""}
                                    onChange={(e) =>
                                      setEditingInvitee({
                                        ...editingInvitee,
                                        city: e.target.value,
                                      })
                                    }
                                    className="px-3 py-2 border-2 border-[#2A3984] rounded-lg w-full"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {invitee.city || "-"}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {invitee.email_sent && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                      📧
                                    </span>
                                  )}
                                  {invitee.whatsapp_sent && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                      📱
                                    </span>
                                  )}
                                  {!invitee.email_sent &&
                                    !invitee.whatsapp_sent && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        لم يتم الإرسال
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {editingInvitee?.id === invitee.id ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={updateInvitee}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                      <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingInvitee(null)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingInvitee(invitee)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => deleteInvitee(invitee.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Add Invitee Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  إضافة مدعو جديد
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newInvitee.name}
                      onChange={(e) =>
                        setNewInvitee({ ...newInvitee, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={newInvitee.email}
                      onChange={(e) =>
                        setNewInvitee({ ...newInvitee, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={newInvitee.phone}
                      onChange={(e) =>
                        setNewInvitee({ ...newInvitee, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      المدينة
                    </label>
                    <input
                      type="text"
                      value={newInvitee.city}
                      onChange={(e) =>
                        setNewInvitee({ ...newInvitee, city: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10 transition-all"
                    />
                  </div>

                  <p className="text-sm text-gray-600">
                    * يجب إدخال البريد الإلكتروني أو رقم الهاتف على الأقل
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addInvitee}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "جاري الإضافة..." : "إضافة"}
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Progress Modal */}
        <AnimatePresence>
          {showProgressModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  جاري إرسال الدعوات
                </h2>

                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم</span>
                      <span>
                        {sendingProgress.current} / {sendingProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (sendingProgress.current / sendingProgress.total) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f]"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {sendingProgress.current === sendingProgress.total
                        ? "اكتمل الإرسال!"
                        : "يرجى الانتظار، قد يستغرق هذا عدة دقائق..."}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {sendingProgress.emailsSent}
                      </div>
                      <div className="text-sm text-gray-600">إيميلات</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {sendingProgress.whatsappsSent}
                      </div>
                      <div className="text-sm text-gray-600">واتساب</div>
                    </div>
                  </div>

                  {/* Errors */}
                  {sendingProgress.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-red-800 mb-2">
                        أخطاء ({sendingProgress.errors.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto text-xs text-red-700 space-y-1">
                        {sendingProgress.errors.slice(0, 5).map((err, idx) => (
                          <div key={idx}>• {err}</div>
                        ))}
                        {sendingProgress.errors.length > 5 && (
                          <div className="text-red-600 font-semibold mt-2">
                            ... و {sendingProgress.errors.length - 5} أخطاء أخرى
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loading Animation */}
                  {sending && (
                    <div className="flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2A3984]" />
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>{" "}
      </div>
    </div>
  );
}
