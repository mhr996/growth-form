"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Edit, Mail } from "lucide-react";

const tabs = [
  { name: "تعديل الحقول", href: "/admin/stages/stage-1", icon: Edit },
  { name: "رسالة الترحيب", href: "/admin/stages/stage-1/welcome", icon: Mail },
];

export default function Stage1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-6 py-4 font-semibold transition-all relative
                  ${
                    isActive
                      ? "text-[#2A3984] border-b-2 border-[#2A3984]"
                      : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
