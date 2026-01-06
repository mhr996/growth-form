"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WhatsAppTestModal } from "@/components/whatsapp-test-modal";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    activeUsers: 0,
    completionRate: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total submissions
      const { count: totalCount } = await supabase
        .from("form_submissions")
        .select("*", { count: "exact", head: true });

      // Unique users
      const { data: submissions } = await supabase
        .from("form_submissions")
        .select("user_email");

      const uniqueUsers = new Set(submissions?.map((s) => s.user_email) || [])
        .size;

      // This month submissions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthCount } = await supabase
        .from("form_submissions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // Completion rate (users who completed all 3 stages)
      const { data: allSubmissions } = await supabase
        .from("form_submissions")
        .select("user_email, stage");

      const userStages: Record<string, Set<number>> = {};
      allSubmissions?.forEach((sub) => {
        if (!userStages[sub.user_email]) {
          userStages[sub.user_email] = new Set();
        }
        userStages[sub.user_email].add(sub.stage);
      });

      const completedUsers = Object.values(userStages).filter(
        (stages) => stages.size === 3
      ).length;

      const completionRate =
        uniqueUsers > 0 ? Math.round((completedUsers / uniqueUsers) * 100) : 0;

      setStats({
        totalSubmissions: totalCount || 0,
        activeUsers: uniqueUsers,
        completionRate,
        thisMonth: monthCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      name: "إجمالي النماذج",
      value: stats.totalSubmissions.toString(),
      icon: FileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "المستخدمين النشطين",
      value: stats.activeUsers.toString(),
      icon: Users,
      color: "from-green-500 to-green-600",
    },
    {
      name: "معدل الإكمال",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "هذا الشهر",
      value: stats.thisMonth.toString(),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A3984] border-t-transparent"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">مرحباً بك في لوحة التحكم</h1>
        <p className="text-white/80">
          إليك نظرة عامة على أداء برنامج Growth Plus
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {stat.name}
            </p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">النشاط الأخير</h2>
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>لا توجد بيانات حالياً</p>
          <p className="text-sm mt-1">سيتم عرض النماذج المقدمة هنا</p>
        </div>
      </motion.div>

      {/* WhatsApp Test Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          اختبار WhatsApp API
        </h2>
        <p className="text-gray-600 mb-4">
          اختبر إرسال رسائل WhatsApp من خلال النظام
        </p>
        <button
          onClick={() => setShowWhatsAppModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          إرسال رسالة تجريبية
        </button>
      </motion.div>

      {/* WhatsApp Modal */}
      <WhatsAppTestModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
}
