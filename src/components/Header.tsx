import React from "react";
import { motion } from "framer-motion";

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
      {/* 🎯 لوجو يتحرك كل فترة */}
      <motion.img
        src="/logo.png"
        alt="Achievo Logo"
        className="w-48 h-24 object-contain drop-shadow-xl"
        animate={{
          rotate: [0, 0, 0, 10, 0], // يهتز أو يميل شويه كل فترة
          scale: [1, 1, 1.05, 1, 1], // يعمل نبضة خفيفة
        }}
        transition={{
          duration: 2, // مدة الحركة نفسها
          repeat: Infinity, // تتكرر
          repeatDelay: 6, // 🔥 كل 6 ثواني تحصل الحركة مرة واحدة
          ease: "easeInOut",
        }}
      />
    </header>
  );
};
