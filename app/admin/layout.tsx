"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const navigation = [
  { name: "لوحة المعلومات", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "النماذج المقدمة", href: "/admin/submissions", icon: FileText },
  {
    name: "المراحل",
    icon: Layers,
    children: [
      { name: "المرحلة 1", href: "/admin/stages/stage-1" },
      { name: "المرحلة 2", href: "/admin/stages/stage-2" },
      { name: "المرحلة 3", href: "/admin/stages/stage-3" },
    ],
  },
  { name: "المشرفين", href: "/admin/admins", icon: Users },
  { name: "الإعدادات", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't wrap login page in protected layout
  if (pathname === "/admin/login" || pathname === "/admin") {
    return <>{children}</>;
  }

  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stagesExpanded, setStagesExpanded] = useState(true);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-row min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen w-72 bg-white shadow-2xl">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-12">
                  <Image
                    src="/logo.webp"
                    alt="Growth Plus"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-900">
                    Growth Plus
                  </h1>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                if (item.children) {
                  // Expandable menu item
                  const hasActiveChild = item.children.some(
                    (child) => pathname === child.href
                  );
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setStagesExpanded(!stagesExpanded)}
                        className={`
                          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium
                          transition-all duration-200
                          ${
                            hasActiveChild
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        {stagesExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: stagesExpanded ? "auto" : 0,
                          opacity: stagesExpanded ? 1 : 0,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pr-6 pt-1 space-y-1">
                          {item.children.map((child) => {
                            const isActive = pathname === child.href;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                  block px-4 py-2 rounded-lg text-sm font-medium
                                  transition-all duration-200
                                  ${
                                    isActive
                                      ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-md"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }
                                `}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>
                  );
                }

                // Regular menu item
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-500 mb-1">مسجل دخول كـ</p>
                <p
                  className="text-sm font-semibold text-gray-900 truncate"
                  dir="ltr"
                >
                  {user?.email}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                  bg-red-50 text-red-600 rounded-xl font-medium
                  hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </motion.button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : "100%" }}
          className="lg:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50"
        >
          <div className="h-full flex flex-col">
            {/* Logo & Close Button */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.webp"
                    alt="Growth Plus"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-900">
                    Growth Plus
                  </h1>
                  <p className="text-xs text-gray-500">لوحة التحكم</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                if (item.children) {
                  // Expandable menu item
                  const hasActiveChild = item.children.some(
                    (child) => pathname === child.href
                  );
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setStagesExpanded(!stagesExpanded)}
                        className={`
                          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium
                          transition-all duration-200
                          ${
                            hasActiveChild
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        {stagesExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: stagesExpanded ? "auto" : 0,
                          opacity: stagesExpanded ? 1 : 0,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pr-6 pt-1 space-y-1">
                          {item.children.map((child) => {
                            const isActive = pathname === child.href;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                  block px-4 py-2 rounded-lg text-sm font-medium
                                  transition-all duration-200
                                  ${
                                    isActive
                                      ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-md"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }
                                `}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>
                  );
                }

                // Regular menu item
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-500 mb-1">مسجل دخول كـ</p>
                <p
                  className="text-sm font-semibold text-gray-900 truncate"
                  dir="ltr"
                >
                  {user?.email}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                  bg-red-50 text-red-600 rounded-xl font-medium
                  hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </motion.button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-gray-900">
                  {navigation.find((item) => item.href === pathname)?.name ||
                    "لوحة التحكم"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2A3984] to-[#3a4a9f] flex items-center justify-center text-white font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
