// src/components/Header.tsx
import React from "react";

export const Header = ({ activeTab, setActiveTab, language, setLanguage }: any) => {
  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">{language === "ar" ? "تطبيقي" : "MyApp"}</h1>

          <nav className="flex items-center gap-2">
            <button onClick={() => setActiveTab("dashboard")} className={`px-3 py-1 rounded ${activeTab === "dashboard" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              {language === "ar" ? "الرئيسية" : "Dashboard"}
            </button>
            <button onClick={() => setActiveTab("tasks")} className={`px-3 py-1 rounded ${activeTab === "tasks" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              {language === "ar" ? "المهام" : "Tasks"}
            </button>
            <button onClick={() => setActiveTab("calendar")} className={`px-3 py-1 rounded ${activeTab === "calendar" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              {language === "ar" ? "التقويم" : "Calendar"}
            </button>
            <button onClick={() => setActiveTab("goals")} className={`px-3 py-1 rounded ${activeTab === "goals" ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>
              {language === "ar" ? "الأهداف" : "Goals"}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-2 py-1 border rounded bg-white dark:bg-gray-800">
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </header>
  );
};
