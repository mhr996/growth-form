"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, LogOut } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-[#2A3984] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            غير مصرح بالدخول
          </h2>
          <p className="text-gray-600 mb-6">
            ليس لديك صلاحية للوصول إلى لوحة التحكم
          </p>
          {user && (
            <p className="text-sm text-gray-500 mb-6">
              مسجل دخول كـ: <span className="font-semibold">{user.email}</span>
            </p>
          )}
          <div className="flex flex-col gap-3">
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-6 py-3 bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري تسجيل الخروج...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              العودة إلى الصفحة الرئيسية
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
