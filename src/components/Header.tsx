import React from "react";

interface HeaderProps {
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ language }) => {
  return (
    <header
      className="
        transition-colors duration-500
        bg-gradient-to-r from-amber-200 to-yellow-300
        dark:from-gray-900 dark:to-gray-800
        backdrop-blur-sm
        flex justify-center items-center
        border-b border-gray-300 dark:border-gray-700
      "
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        paddingTop: "0.25rem",
        paddingBottom: "0.25rem",
        lineHeight: 0,
        height: "auto",
      }}
    >
      {/* تمت إزالة اللوجو */}
    </header>
  );
};
