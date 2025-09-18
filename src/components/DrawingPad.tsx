// src/components/DrawingPad.tsx
import React, { useRef, useState } from "react";
import {
  Save,
  Trash2,
  FolderOpen,
  Pencil,
  Eraser,
  Undo,
  Redo,
  Download,
} from "lucide-react";

interface DrawingPadProps {
  language: "ar" | "en";
}

const DrawingPad: React.FC<DrawingPadProps> = ({ language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);

  // تاريخ (Undo/Redo)
  const history = useRef<ImageData[]>([]);
  const historyStep = useRef(0);

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !ctxRef.current) return;
    const ctx = ctxRef.current;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    if (tool === "pencil") {
      ctx.strokeStyle = color;
    } else {
      ctx.strokeStyle = "#ffffff"; // الممحاة
    }

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (ctxRef.current) {
      ctxRef.current.closePath();
      saveHistory();
    }
    setDrawing(false);
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    history.current = history.current.slice(0, historyStep.current + 1);
    history.current.push(snapshot);
    historyStep.current++;
  };

  const undo = () => {
    if (historyStep.current > 0) {
      historyStep.current--;
      restoreHistory();
    }
  };

  const redo = () => {
    if (historyStep.current < history.current.length - 1) {
      historyStep.current++;
      restoreHistory();
    }
  };

  const restoreHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(history.current[historyStep.current], 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">
        {t("🎨 لوحة الرسم", "🎨 Drawing Pad")}
      </h2>

      {/* الأدوات */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTool("pencil")}
          className={`px-3 py-2 rounded flex items-center gap-2 ${
            tool === "pencil" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          <Pencil className="w-5 h-5" />
          {t("قلم", "Pencil")}
        </button>

        <button
          onClick={() => setTool("eraser")}
          className={`px-3 py-2 rounded flex items-center gap-2 ${
            tool === "eraser" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          <Eraser className="w-5 h-5" />
          {t("ممحاة", "Eraser")}
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 border rounded"
          title={t("اختر اللون", "Pick color")}
        />

        <input
          type="range"
          min={1}
          max={20}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-32"
        />

        <button
          onClick={undo}
          className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2"
        >
          <Undo className="w-5 h-5" /> {t("تراجع", "Undo")}
        </button>
        <button
          onClick={redo}
          className="px-3 py-2 rounded bg-gray-200 flex items-center gap-2"
        >
          <Redo className="w-5 h-5" /> {t("إعادة", "Redo")}
        </button>
        <button
          onClick={clearCanvas}
          className="px-3 py-2 rounded bg-red-500 text-white flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" /> {t("مسح", "Clear")}
        </button>
        <button
          onClick={saveImage}
          className="px-3 py-2 rounded bg-green-500 text-white flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> {t("حفظ", "Save")}
        </button>
      </div>

      {/* اللوحة */}
      <div className="border rounded-lg overflow-hidden shadow bg-white dark:bg-gray-800">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="block w-full h-[500px] cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default DrawingPad;
