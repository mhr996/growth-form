"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push("/admin/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e2a5c] to-[#2A3984]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

      {/* Floating shapes */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-2"
          >
            <div className="relative w-28 h-28 drop-shadow-2xl">
              <Image
                src="/logo.webp"
                alt="Growth Plus"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                لوحة التحكم
              </h1>
              <p className="text-gray-600">تسجيل الدخول للمسؤولين فقط</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="admin@growthplus.com"
                    className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-gray-200 bg-white
                      transition-all duration-300 text-base
                      focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10
                      hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pr-12 pl-4 py-4 rounded-xl border-2 border-gray-200 bg-white
                      transition-all duration-300 text-base
                      focus:border-[#2A3984] focus:ring-4 focus:ring-[#2A3984]/10
                      hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] 
                  text-white font-bold text-lg shadow-xl hover:shadow-2xl 
                  transition-all duration-300 flex items-center justify-center gap-3
                  disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </motion.button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              لوحة التحكم محمية ومخصصة للمسؤولين فقط
            </p>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/60 text-sm mt-8"
          >
            Growth Plus © 2026
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
