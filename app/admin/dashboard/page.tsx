"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    activeUsers: 0,
    completionRate: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
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
    </div>
  );
}
