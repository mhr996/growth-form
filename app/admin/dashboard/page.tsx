"use client";

import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";

const stats = [
  {
    name: "إجمالي النماذج",
    value: "0",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "المستخدمين النشطين",
    value: "0",
    icon: Users,
    color: "from-green-500 to-green-600",
  },
  {
    name: "معدل الإكمال",
    value: "0%",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "هذا الشهر",
    value: "0",
    icon: Clock,
    color: "from-orange-500 to-orange-600",
  },
];

export default function DashboardPage() {
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
        {stats.map((stat, index) => (
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
