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

  // الخدمات
  const services = [
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  // Variants للأنيميشن
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  };

  // اغلاق عند الضغط خارج
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(e.target as Node) &&
        !plusBtnRef.current?.contains(e.target as Node)
      ) {
        setServicesOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

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
        {/* زر + (في الوسط) */}
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

            {/* خلفية شفافة عند فتح الخدمات */}
            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  aria-hidden
                  onClick={() => setServicesOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* شبكة الخدمات */}
            
            
            {/* شبكة الخدمات */}
{/* شبكة الخدمات */}
{/* شبكة الخدمات */}
<AnimatePresence>
  {servicesOpen && (
    <motion.div
      ref={servicesRef}
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={containerVariants}
      transition={{ duration: 0.25 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 
                 w-[min(92vw,500px)] max-h-[60vh] overflow-y-auto"
    >
      <div
        className="
          bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 
          grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-6
        "
      >
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <motion.div
              key={srv.key}
              variants={itemVariants}
              className="flex flex-col items-center"
            >
              <button
                aria-label={srv.label}
                title={srv.label}
                onClick={() => {
                  setActiveTab(srv.key);
                  setServicesOpen(false);
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all duration-150 ${
                  activeTab === srv.key
                    ? "bg-blue-500 text-white scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-lg"
                }`}
              >
                <Icon size={24} />
              </button>
              <span className="mt-3 text-sm text-gray-800 dark:text-gray-200 text-center">
                {srv.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  )}
</AnimatePresence>

            
         
         
         
         
         
         
         
         
         
          </div>
        </div>

        {/* زر الرئيسية (أقصى اليمين) */}
        <div className="pointer-events-auto ml-auto">
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
