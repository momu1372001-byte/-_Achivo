import React, { useRef, useState, useEffect } from "react";

interface Props {
  language?: "ar" | "en" | string;
}

const DrawingPad: React.FC<Props> = ({ language = "ar" }) => {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState<string>("#1f2937"); // default gray-800
  const [size, setSize] = useState<number>(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const MAX_STACK = 30;

  // initialize canvas size & context
  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;
    const ratio = window.devicePixelRatio || 1;





    


    const fit = () => {
      const w = parent.clientWidth;
      const h = Math.max(300, window.innerHeight * 0.5);
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;

      // ✅ استرجاع الرسم المحفوظ من localStorage
      const savedImage = localStorage.getItem("drawing-pad");
      if (savedImage) {
        const img = new Image();
        img.src = savedImage;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
        };
      } else if (undoStack.length > 0) {
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
        };
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: push snapshot to undo stack + save
  const pushSnapshot = () => {
    const canvas = canvasRef.current!;
    try {
      const data = canvas.toDataURL("image/png");

      // ✅ نحفظ في localStorage
      localStorage.setItem("drawing-pad", data);

      setUndoStack((prev) => {
        const next = [...prev, data].slice(-MAX_STACK);
        return next;
      });
      setRedoStack([]); // clear redo on new action
    } catch (err) {
      console.error("Snapshot error", err);
    }
  };

  const getPointerPos = (e: PointerEvent | React.PointerEvent | TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    // @ts-ignore
    if ("clientX" in e && "clientY" in e) {
      clientX = (e as PointerEvent).clientX;
      clientY = (e as PointerEvent).clientY;
} else if ("changedTouches" in e) {
    const t = (e as TouchEvent).changedTouches[0];
    clientX = t.clientX;
    clientY = t.clientY;
}


    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (clientEvent: React.PointerEvent | React.TouchEvent) => {
    pushSnapshot(); // snapshot قبل البداية
    drawingRef.current = true;
    lastPointRef.current = getPointerPos((clientEvent as unknown) as PointerEvent);
    // @ts-ignore
    if (clientEvent.currentTarget && (clientEvent.currentTarget as Element).setPointerCapture) {
      // @ts-ignore
      (clientEvent.currentTarget as Element).setPointerCapture((clientEvent as any).pointerId);
    }
  };

  const drawMove = (clientEvent: React.PointerEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const pos = getPointerPos((clientEvent as unknown) as PointerEvent);
    const ctx = ctxRef.current;
    if (!ctx || !lastPointRef.current) return;

    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = size * 3;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

    lastPointRef.current = pos;
  };

  const endDrawing = (clientEvent?: React.PointerEvent | React.TouchEvent) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    // @ts-ignore
    try {
      if (clientEvent && clientEvent.currentTarget && (clientEvent.currentTarget as Element).releasePointerCapture) {
        // @ts-ignore
        (clientEvent.currentTarget as Element).releasePointerCapture((clientEvent as any).pointerId);
      }
    } catch {}
    pushSnapshot(); // snapshot بعد النهاية
  };

  const saveAsImage = () => {
    const canvas = canvasRef.current!;
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = "drawing.png";
    link.click();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushSnapshot();
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length <= 1) {
        setRedoStack((rprev) => (prev.length === 1 ? [prev[0], ...rprev] : rprev));
        const canvas = canvasRef.current!;
        const ctx = ctxRef.current!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        localStorage.removeItem("drawing-pad"); // ✅ إزالة الحفظ عند المسح الكامل
        return [];
      }
      const next = [...prev];
      const last = next.pop()!;
      const prevSnapshot = next[next.length - 1];
      setRedoStack((rprev) => [last, ...rprev].slice(0, MAX_STACK));

      const img = new Image();
      img.src = prevSnapshot;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ratio = window.devicePixelRatio || 1;
        const ctx = ctxRef.current!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
      };

      // ✅ نحفظ آخر نسخة في localStorage
      localStorage.setItem("drawing-pad", prevSnapshot);

      return next;
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      setUndoStack((uPrev) => [...uPrev, first].slice(-MAX_STACK));

      const img = new Image();
      img.src = first;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ratio = window.devicePixelRatio || 1;
        const ctx = ctxRef.current!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
      };

      // ✅ نحفظ في localStorage
      localStorage.setItem("drawing-pad", first);

      return rest;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    try {
      const blank = canvas.toDataURL("image/png");
      setUndoStack([blank]);
      localStorage.setItem("drawing-pad", blank); // ✅ أول مرة نحفظ نسخة فارغة
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">{t("لوحة الرسم", "Drawing pad")}</h2>

      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm">{t("أداة:", "Tool:")}</label>
          <button
            onClick={() => setTool("pen")}
            className={`px-3 py-1 rounded ${tool === "pen" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            {t("قلم", "Pen")}
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`px-3 py-1 rounded ${tool === "eraser" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            {t("ممحاة", "Eraser")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">{t("اللون:", "Color:")}</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">{t("حجم:", "Size:")}</label>
          <input type="range" min={1} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <span className="text-sm w-8 text-center">{size}</span>
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={undo} className="px-3 py-1 bg-gray-100 rounded">{t("تراجع", "Undo")}</button>
          <button onClick={redo} className="px-3 py-1 bg-gray-100 rounded">{t("إعادة", "Redo")}</button>
          <button onClick={clearCanvas} className="px-3 py-1 bg-red-500 text-white rounded">{t("مسح", "Clear")}</button>
          <button onClick={saveAsImage} className="px-3 py-1 bg-green-600 text-white rounded">{t("حفظ كصورة", "Save PNG")}</button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ touchAction: "none", display: "block", width: "100%", height: "420px" }}
          onPointerDown={(e) => startDrawing(e)}
          onPointerMove={(e) => drawMove(e)}
          onPointerUp={(e) => endDrawing(e)}
          onPointerCancel={(e) => endDrawing(e)}
        />
      </div>

      <p className="text-xs mt-2 text-gray-500">
        {t("✅ يدعم الحفظ التلقائي. ادعم الكتابة باللمس والفأرة مع التراجع والإعادة.", 
           "✅ Auto-saves. Supports touch & mouse with undo/redo.")}
      </p>
    </div>
  );
};

export default DrawingPad;
