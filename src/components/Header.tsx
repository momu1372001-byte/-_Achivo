import React from "react";
import { Target } from "lucide-react";

interface HeaderProps {
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ language }) => {
  const texts = {
    ar: { appName: " Achievo" },
    en: { appName: "Task Organizer" },
  };

  const t = language === "ar" ? texts.ar : texts.en;

  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-4">
          <Target className="w-8 h-8 text-blue-600" />
          <h1 className="ml-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t.appName}
          </h1>
        </div>
      </div>
    </header>
  );
};
