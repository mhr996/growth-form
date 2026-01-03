"use client";

import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function Stage2Page() {
  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-full mb-6">
          <Construction className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          المرحلة الثانية
        </h1>
        <p className="text-gray-600 text-lg">هذه الصفحة قيد الإنشاء</p>
      </motion.div>
    </div>
  );
}
