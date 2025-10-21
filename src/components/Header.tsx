import React from "react";

interface HeaderProps {
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ language }) => {
  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 flex justify-center items-center"
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 0,
        height: "auto",
      }}
    >
      {/* ✅ اللوجو فقط في المنتصف، والهيدر أنحف ما يمكن */}
      <img
        src="/logo.png"
        alt="Achievo Logo"
        className="w-48 h-24 object-contain"
        style={{
          margin: 0,
          padding: 0,
          display: "block",
        }}
      />
    </header>
  );
};
