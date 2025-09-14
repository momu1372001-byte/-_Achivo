// server/ai-insights.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 مهم: لازم تحط الـ API Key في متغير بيئة
// في Windows CMD:   setx OPENAI_API_KEY "your_api_key_here"
// في PowerShell:    $env:OPENAI_API_KEY="your_api_key_here"
// في Linux/Mac:     export OPENAI_API_KEY="your_api_key_here"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📌 API route للذكاء الاصطناعي
app.post("/ai-insights", async (req, res) => {
  const { tasks } = req.body;

  try {
    // طلب للذكاء الاصطناعي لتحليل المهام
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ممكن تغيره لأي موديل متاح
      messages: [
        { role: "system", content: "أنت مساعد ذكي لإدارة المهام. قدم تحليلات ونصائح عملية." },
        { role: "user", content: `دي قائمة المهام عندي: ${JSON.stringify(tasks)}` },
      ],
    });

    // استخراج النص من رد الذكاء الاصطناعي
    const aiText = response.choices[0].message?.content || "";

    res.json({
      insights: aiText
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "")
    });
  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({ insights: ["حصل خطأ أثناء جلب التحليلات من الذكاء الاصطناعي."] });
  }
});

// 🟢 Run server
app.listen(4000, () => {
  console.log("🚀 AI server running on http://localhost:4000");
});
