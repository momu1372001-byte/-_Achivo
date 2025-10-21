import React from "react";

interface HeaderProps {
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ language }) => {
  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700"
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{ paddingTop: 0, paddingBottom: 0, lineHeight: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <img
            src="/logo.png"
            alt="Achievo Logo"
            className="w-48 h-auto object-contain"
            style={{ margin: 0, padding: 0 }}
          />
        </div>
      </div>
    </header>
  );
};
