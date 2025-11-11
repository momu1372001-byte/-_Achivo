import React from "react";
import { motion } from "framer-motion";

interface HeaderProps {
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ language }) => {
  const logo = "Achievo".split("");

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
        paddingTop: "1rem",
        paddingBottom: "1rem",
        height: "80px", // زيادة ارتفاع الهيدر
      }}
    >
      <h1
        dir="ltr" // مهم جداً لتجنب قلب النص
        className="flex space-x-2 text-4xl font-extrabold text-gray-800 dark:text-gray-200"
      >
        {logo.map((char, index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -10, 0] }} // حركة صعود وهبوط لكل حرف
            transition={{ repeat: Infinity, duration: 1.2, delay: index * 0.1 }}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </h1>
    </header>
  );
};
