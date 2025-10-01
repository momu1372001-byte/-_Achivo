// src/components/UnifiedBottomNav.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Calendar,
  Target,
  FileText,
  PenTool,
  Timer,
  ListTodo,
  Settings,
  Bot,
  Menu,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenAI: () => void;
  language?: "ar" | "en";
}

const UnifiedBottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAI,
  language = "ar",
}) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement | null>(null);

  const services = [
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  // اغلاق عند الضغط خارج الحاوية او الضغط على Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (servicesOpen) {
        if (
          servicesRef.current &&
          !servicesRef.current.contains(target) &&
          plusBtnRef.current &&
          !plusBtnRef.current.contains(target)
        ) {
          setServicesOpen(false);
        }
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  return (
    <>
      {/* زر القائمة العلوية (Settings + AI) */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpenMenu((s) => !s)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          aria-label="menu"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        {openMenu && (
          <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <button
              onClick={() => {
                onOpenAI();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bot size={20} />
              <span>{language === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Settings size={20} />
              <span>{language === "ar" ? "الإعدادات" : "Settings"}</span>
            </button>
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div className="fixed bottom-6 w-full px-6 z-50 flex items-center justify-between pointer-events-none">
        {/* نسمح فقط للأزرار بالتفاعل داخل هذا الشريط */}
        <div className="pointer-events-auto" />

        {/* زر + في المنتصف */}
        <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
          <div className="relative">
            <button
              ref={plusBtnRef}
              onClick={() => setServicesOpen((s) => !s)}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition"
            >
              <Plus
                size={30}
                className={`${servicesOpen ? "rotate-45 transition" : "transition"}`}
              />
            </button>

            {/* حاوية الخدمات: متمركزة تماماً وفوق زر + */}
            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  ref={servicesRef}
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.18 }}
                  // style grid مع min width لكل عنصر حتى لا يتكدس
                  style={{
                    width: "min(90vw, 420px)",
                    maxHeight: "calc(100vh - 220px)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
                  }}
                  className="absolute bottom-24 left-1/2 transform -translate-x-1/2
                             bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4
                             z-50 overflow-y-auto"
                >
                  {/* استخدام شبكة CSS داخلية (مما يسمح بالـ auto-fit عبر style) */}
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                      gridTemplateColumns: "inherit",
                      justifyItems: "center",
                    }}
                    className="w-full"
                  >
                    {services.map((srv) => {
                      const Icon = srv.icon;
                      return (
                        <div key={srv.key} className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              setActiveTab(srv.key);
                              setServicesOpen(false);
                            }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition
                              ${activeTab === srv.key
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            aria-label={srv.key}
                          >
                            <Icon size={22} />
                          </button>
                          <span className="mt-2 text-sm text-gray-800 dark:text-gray-200 text-center">
                            {srv.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* زر الرئيسية (أقصى اليمين) */}
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setServicesOpen(false);
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition ${
              activeTab === "dashboard"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            aria-label="home"
          >
            <Home size={28} />
          </button>
        </div>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
