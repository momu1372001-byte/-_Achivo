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
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
  const [homeMoved, setHomeMoved] = useState(false); // لو true → نحرك أيقونة الـ Home أبعد
  const containerRef = useRef<HTMLDivElement | null>(null); // يحتوي زر + و البطاقة
  const menuRef = useRef<HTMLDivElement | null>(null); // يحتوي قائمة الإعدادات العليا
  const prefersReducedMotion = useReducedMotion();

  // قائمة الخدمات (بدون dashboard لأن Home خارجي)
  const services = [
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  // إغلاق بالـ Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setServicesOpen(false);
        setOpenMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // إغلاق بالنقر خارج القوائم — نستخدم 'click' (حتى لا نغلق قبل تنفيذ onClick للأزرار)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node | null;
      const insideContainer = containerRef.current && target && containerRef.current.contains(target);
      const insideMenu = menuRef.current && target && menuRef.current.contains(target);

      if (!insideContainer && !insideMenu) {
        setServicesOpen(false);
        setOpenMenu(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // متغيرات الحركة (سريعة بشكل عام — حتى نحصل على إحساس التنقل الفوري)
  const containerVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.02 } }, // stagger صغير
      };

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 6, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 700, damping: 20, duration: 0.12 } },
      };

  // عند الضغط على أي خدمة: نريد "سرعة رهيبة" في التنقل => ننفذ التعيين فورًا ثم نغلق القائمة بسرعة
  const handleServiceClick = (key: string) => {
    // تغير الـ activeTab سريعًا (الفعل الأساسي)
    setActiveTab(key);

    // نبعد أيقونة الـ Home (تتحرك أبعد لتمييز انفصالها)
    setHomeMoved(true);

    // نغلق القائمة بسرعة — ننتقل بدون انتظار أنيميشن طويل
    setServicesOpen(false);
    setOpenMenu(false);
  };

  // متى نظهر أيقونة Home البعيدة؟ نظهرها لو activeTab !== 'dashboard'
  const showFarHome = activeTab !== "dashboard";

  return (
    <>
      {/* قائمة الإعدادات اليسار العليا */}
      <div ref={menuRef} className="fixed top-4 left-4 z-[90]">
        <button
          aria-expanded={openMenu}
          aria-label={language === "ar" ? "قائمة" : "Menu"}
          onClick={() => setOpenMenu((s) => !s)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.08 }}
              className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              role="menu"
              aria-label={language === "ar" ? "قائمة الإعدادات" : "Settings menu"}
            >
              <button
                type="button"
                onClick={() => {
                  // تنفيذ onOpenAI أولاً — document 'click' لن يغلق قبل تنفيذ هذا الـ onClick
                  onOpenAI();
                  setOpenMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                <Bot size={18} />
                <span>{language === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setOpenMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                <Settings size={18} />
                <span>{language === "ar" ? "الإعدادات" : "Settings"}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* الحاوية السفلية (زر + و بطاقة الخدمات و الـ Home البعيد) */}
      <div ref={containerRef} className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[80] flex flex-col items-center">
        {/* backdrop (ز أقل من العناصر التفاعلية عشان ما يغطيهم) */}
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="fixed inset-0 z-[70] bg-black/18 backdrop-blur-sm"
              aria-hidden
              onClick={() => setServicesOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* بطاقة الخدمات */}
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={containerVariants}
              transition={{ duration: 0.08 }}
              className="z-[81] mb-4"
            >
              <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 w-[min(92vw,720px)]">
                {services.map((srv) => {
                  const Icon = srv.icon;
                  return (
                    <motion.div key={srv.key} variants={itemVariants} className="flex flex-col items-center">
                      <button
                        type="button"
                        aria-label={srv.label}
                        title={srv.label}
                        onClick={() => handleServiceClick(srv.key)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transform transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                          activeTab === srv.key
                            ? "bg-blue-500 text-white scale-105 shadow-lg"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-md"
                        }`}
                      >
                        <Icon size={22} />
                      </button>

                      <span className="mt-2 text-[11px] text-gray-800 dark:text-gray-200 text-center">{srv.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* صف التحكم: زر + وفي حالة showFarHome يتم عرض Home البعيد (متحرك) */}
        <div className="flex items-center gap-3 z-[82]">
          {/* أيقونة Home بعيدة مع حركة عند homeMoved */}
          <AnimatePresence>
            {showFarHome && (
              <motion.div
                key="far-home"
                initial={{ opacity: 0, x: -6, y: 6, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  x: homeMoved ? -36 : 0, // نبعدها أكثر لو homeMoved = true
                  y: homeMoved ? -36 : 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: -6, y: 6, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.12 }}
                className="fixed left-6 bottom-6 z-[83]"
              >
                <button
                  type="button"
                  aria-label={language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                  title={language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                  onClick={() => {
                    // العودة للرئيسية بسرعة
                    setActiveTab("dashboard");
                    setHomeMoved(false);
                    setServicesOpen(false);
                    setOpenMenu(false);
                  }}
                  className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <Home size={20} className="text-gray-700 dark:text-gray-200" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* زر + */}
          <button
            type="button"
            aria-expanded={servicesOpen}
            aria-label={servicesOpen ? (language === "ar" ? "إغلاق" : "Close") : (language === "ar" ? "فتح الخدمات" : "Open services")}
            onClick={() => setServicesOpen((s) => !s)}
            className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-transform transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {servicesOpen ? <X size={28} /> : <Plus size={28} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
