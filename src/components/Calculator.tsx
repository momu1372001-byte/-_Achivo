// SmartCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";
import { History, RefreshCw, ArrowLeftRight } from "lucide-react";

/**
 * SmartCalculator.tsx
 * - لوحة مفاتيح مشتركة + لوحات وضعية فريدة (no overlap)
 * - كل الأزرار تعمل، لا تكرار بين الأوضاع
 * - ثابت (non-moving UI)
 */

/* ---------- constants ---------- */
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "EGP", "AED", "SAR", "CAD", "AUD", "CHF"];

/* ---------- helpers ---------- */
function safeNumber(v: unknown) {
  return typeof v === "number" && isFinite(v);
}

/* ========== useCalculator Hook ========== */
function useCalculator() {
  const [expr, setExpr] = useState<string>("");
  const [display, setDisplay] = useState<string>("0");
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [error, setError] = useState<string>("");

  const fmt = (n: number) => {
    if (!isFinite(n)) return "Error";
    return Number.parseFloat(n.toPrecision(12)).toString();
  };

  const append = (val: string) => {
    setError("");
    if (!val) return;
    // منع تكرار دالة متبوعة بنفس اسمها (مثال: "sin(" ثم "sin(")
    const fnName = val.match(/^([a-zA-Z]+)\(?/)?.[1];
    const lastFn = expr.match(/([a-zA-Z]+)\($/)?.[1];
    if (fnName && lastFn && fnName === lastFn) return;
    setExpr((p) => p + val);
    setDisplay((p) => (p === "0" ? val : p + val));
  };

  const clearAll = () => {
    setExpr("");
    setDisplay("0");
    setError("");
  };
  const backspace = () => {
    setExpr((p) => {
      const next = p.slice(0, -1);
      setDisplay(next || "0");
      return next;
    });
  };

  const evaluateExpression = (input: string) => {
    const raw = (input || "").trim();
    if (!raw) return 0;
    // تحويل رموز العرض لرموز JS أو دوال معرفة
    let s = raw
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      // نستخدم ^ للرفع (power) باستبداله بعد ذلك إلى **
      .replace(/\^/g, "**")
      .replace(/\bπ\b|\bPI\b|\bpi\b/g, "PI")
      .replace(/\be\b/g, "E");
    s = s.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    s = s
      .replace(/\blog\(/g, "log10(")
      .replace(/\bln\(/g, "ln(")
      .replace(/\bsqrt\(/g, "sqrt(")
      .replace(/\babs\(/g, "abs(")
      .replace(/\bexp\(/g, "exp(")
      .replace(/\bpow\(/g, "pow(");

    // السماح بحروف/أرقام/مسافات وبعض الرموز (&|~) للعمليات البتية
    if (!/^[0-9+\-*/()., _%A-Za-z*&|~]*$/.test(s)) {
      throw new Error("Unsafe characters");
    }

    // إغلاق الأقواس المفتوحة تلقائياً
    const open = (s.match(/\(/g) || []).length;
    const close = (s.match(/\)/g) || []).length;
    if (open > close) s = s + ")".repeat(open - close);

    const PI = Math.PI;
    const E = Math.E;

    // دوال مساعدة متاحة داخل التعبير
    const helpers: Record<string, Function> = {
      sin: (x: number) => Math.sin(x),
      cos: (x: number) => Math.cos(x),
      tan: (x: number) => Math.tan(x),
      asin: (x: number) => Math.asin(x),
      acos: (x: number) => Math.acos(x),
      atan: (x: number) => Math.atan(x),
      sqrt: (x: number) => Math.sqrt(x),
      abs: (x: number) => Math.abs(x),
      ln: (x: number) => Math.log(x),
      log10: (x: number) => (Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10),
      exp: (x: number) => Math.exp(x),
      pow: (a: number, b: number) => Math.pow(a, b),
      xor: (a: number, b: number) => (a | 0) ^ (b | 0), // لنستعمل xor() في وضع المبرمج
      PI,
      E,
    };

    // منع كلمات خطيرة
    if (/\b(window|global|process|constructor|self|document|require|module|eval|Function)\b/.test(s)) {
      throw new Error("Unsafe");
    }

    try {
      const fn = new Function(...Object.keys(helpers), `return (${s});`);
      // @ts-ignore
      const result = fn(...Object.values(helpers));
      if (typeof result !== "number" || !isFinite(result)) throw new Error("Math error");
      return result as number;
    } catch (e: any) {
      throw new Error("Invalid expression");
    }
  };

  const evaluate = () => {
    try {
      const val = evaluateExpression(expr || display);
      const res = fmt(val);
      setDisplay(res);
      setExpr(res);
      setHistory((h) => [{ expr: expr || display, result: res }, ...h].slice(0, 200));
      setError("");
      return res;
    } catch (e: any) {
      setError(e?.message || "Invalid expression");
      setDisplay("Error");
      throw e;
    }
  };

  const toggleSign = () => {
    try {
      const v = evaluateExpression(expr || display);
      setExpr(String(-v));
      setDisplay(String(-v));
      setError("");
    } catch {
      setError("Invalid");
    }
  };

  const memoryClear = () => setMemory(0);
  const memoryRecall = () => setExpr((p) => p + String(memory));
  const memoryAdd = () => {
    try {
      setMemory((m) => m + evaluateExpression(expr || display));
    } catch {
      setError("Invalid");
    }
  };
  const memorySub = () => {
    try {
      setMemory((m) => m - evaluateExpression(expr || display));
    } catch {
      setError("Invalid");
    }
  };

  return {
    expr,
    setExpr,
    display,
    setDisplay,
    memory,
    history,
    setHistory,
    error,
    setError,
    append,
    clearAll,
    backspace,
    toggleSign,
    memoryClear,
    memoryRecall,
    memoryAdd,
    memorySub,
    evaluate,
    fmt,
  };
}

/* ========== useCurrency Hook ========== */
function useCurrency() {
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("EGP");
  const [amount, setAmount] = useState<string>("1");
  const [rate, setRate] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchRateAndConvert = async (f = from, t = to, amt = parseFloat(amount)) => {
    setError("");
    if (!f || !t) return;
    if (isNaN(amt)) {
      setResult("");
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}&amount=${encodeURIComponent(String(amt))}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && safeNumber(data.result)) {
        setRate(typeof data.info === "object" && safeNumber(data.info?.rate) ? data.info.rate : null);
        setResult(Number(data.result).toFixed(6));
      } else {
        const fb = await fetch(`https://api.exchangerate.host/latest?base=${encodeURIComponent(f)}&symbols=${encodeURIComponent(t)}`);
        const fd = await fb.json();
        const r = fd?.rates?.[t];
        if (safeNumber(r)) {
          setRate(r);
          setResult((amt * r).toFixed(6));
        } else {
          setResult("");
          setError("فشل في جلب سعر الصرف");
        }
      }
    } catch (e) {
      console.error(e);
      setError("خطأ في الاتصال");
      setResult("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchRateAndConvert();
    }, 350);
    return () => clearTimeout(id);
  }, [from, to, amount]);

  const swap = () => {
    const old = from;
    setFrom(to);
    setTo(old);
    setTimeout(() => fetchRateAndConvert(to, old, parseFloat(amount)), 0);
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    amount,
    setAmount,
    rate,
    result,
    loading,
    error,
    fetchRateAndConvert,
    swap,
  };
}

/* ========== Main Component ========== */
export default function SmartCalculator(): JSX.Element {
  const [mode, setMode] = useState<"calculator" | "converter">("calculator");
  const [calcTab, setCalcTab] = useState<"standard" | "scientific" | "programmer">("standard");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const calc = useCalculator();
  const currency = useCurrency();

  // --- unique keys (no overlap) ---
  const scientificKeys = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "ln(", "log10(", "sqrt(", "abs(", "exp(", "pow(" , "PI"];
  const programmerKeys = ["BIN", "DEC", "HEX", "AND", "OR", "XOR", "NOT"];

  // --- common keypad (shared, only here) ---
  const commonKeys = [
    ["MC", "MR", "M+", "M-"],
    ["(", ")", "C", "⌫"],
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["±", "0", ".", "+"],
    ["%", "^", "=", ""],
  ];

  // handlers
  const handleCommonKey = (k: string) => {
    if (!k) return;
    switch (k) {
      case "C":
        calc.clearAll();
        break;
      case "⌫":
        calc.backspace();
        break;
      case "=":
        try { calc.evaluate(); } catch {}
        break;
      case "±":
        calc.toggleSign();
        break;
      case "MC":
        calc.memoryClear();
        break;
      case "MR":
        calc.memoryRecall();
        break;
      case "M+":
        calc.memoryAdd();
        break;
      case "M-":
        calc.memorySub();
        break;
      default:
        // مباشرة نضيف الرموز كما هي؛ evaluateExpression يتعامل مع × ÷ ^ %
        calc.append(k);
    }
  };

  const handleScientificKey = (k: string) => {
    // append function tokens (تنتهي بـ "(" لسهولة إدخال المعامل)
    calc.append(k);
  };

  const handleProgrammerKey = (k: string) => {
    if (k === "BIN" || k === "DEC" || k === "HEX") {
      try {
        const num = Number(calc.expr || calc.display);
        if (isNaN(num)) throw new Error();
        if (k === "BIN") calc.setDisplay((num | 0).toString(2));
        if (k === "DEC") calc.setDisplay(String(num));
        if (k === "HEX") calc.setDisplay((num | 0).toString(16).toUpperCase());
        calc.setExpr(String(num));
      } catch {
        calc.setError("Invalid");
      }
      return;
    }
    // لعمليات بتية نستخدم رموز أو دالة xor
    if (k === "AND") calc.append("&");
    else if (k === "OR") calc.append("|");
    else if (k === "XOR") calc.append(" xor "); // دالة xor موجودة في helpers
    else if (k === "NOT") calc.append("~");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 space-y-4">

          {/* header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setMode("calculator")} className={`px-3 py-2 rounded-md text-sm ${mode === "calculator" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>الآلة الحاسبة</button>
              <button onClick={() => setMode("converter")} className={`px-3 py-2 rounded-md text-sm ${mode === "converter" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>سعر الصرف</button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowHistoryModal(true)} title="سجل العمليات" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <History size={18} />
              </button>
            </div>
          </div>

          {/* main (ثابت، non-moving) */}
          <div className="grid grid-cols-1 gap-4">
            {mode === "calculator" ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {/* tabs */}
                <div className="flex border-b mb-3">
                  <button onClick={() => setCalcTab("standard")} className={`px-3 py-2 -mb-px font-medium ${calcTab === "standard" ? "border-b-2 border-blue-500 text-blue-600 bg-white dark:bg-gray-800" : "border-b-2 border-transparent text-gray-600 hover:text-blue-600"}`}>عادي</button>
                  <button onClick={() => setCalcTab("scientific")} className={`px-3 py-2 -mb-px font-medium ${calcTab === "scientific" ? "border-b-2 border-blue-500 text-blue-600 bg-white dark:bg-gray-800" : "border-b-2 border-transparent text-gray-600 hover:text-blue-600"}`}>علمي</button>
                  <button onClick={() => setCalcTab("programmer")} className={`px-3 py-2 -mb-px font-medium ${calcTab === "programmer" ? "border-b-2 border-blue-500 text-blue-600 bg-white dark:bg-gray-800" : "border-b-2 border-transparent text-gray-600 hover:text-blue-600"}`}>مبرمج</button>
                </div>

                {/* display */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded text-right font-mono text-2xl min-h-[72px] break-words">
                  {calc.expr || calc.display}
                </div>
                {calc.error && <div className="text-red-500 text-sm mt-2">{calc.error}</div>}

                {/* mode-specific unique keys (لا يوجد تكرار مع الـ common keypad) */}
                <div className="mt-3">
                  {calcTab === "scientific" && (
                    <div className="grid grid-cols-4 gap-2">
                      {scientificKeys.map((k) => (
                        <button key={k} onClick={() => handleScientificKey(k)} className="py-2 rounded-lg bg-indigo-100 dark:bg-indigo-700 text-sm font-medium">
                          {k.replace("log10(", "log(")}
                        </button>
                      ))}
                    </div>
                  )}

                  {calcTab === "programmer" && (
                    <div className="grid grid-cols-4 gap-2">
                      {programmerKeys.map((k) => (
                        <button key={k} onClick={() => handleProgrammerKey(k)} className="py-2 rounded-lg bg-amber-100 dark:bg-amber-700 text-sm font-medium">
                          {k}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* common keypad (shared, one place only) */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {commonKeys.flat().map((k, i) => (
                    <button
                      key={i}
                      onClick={() => handleCommonKey(k)}
                      className={`py-3 rounded-lg font-medium text-sm select-none
                        ${k === "=" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                        ${["+", "-", "×", "÷", "^"].includes(k) ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                        ${["C", "⌫", "MC", "MR", "M+", "M-"].includes(k) ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400" : ""}
                        ${k && !["=", "+", "-", "×", "÷", "^", "C", "⌫", "MC", "MR", "M+", "M-"].includes(k) ? "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300" : ""}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {/* converter */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">محول العملات</div>
                  <div className="flex gap-2">
                    <button onClick={() => currency.fetchRateAndConvert?.()} title="تحديث" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={16} /></button>
                    <button onClick={() => currency.swap()} title="تبديل" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeftRight size={16} /></button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex gap-2">
                    <select value={currency.from} onChange={(e) => currency.setFrom(e.target.value)} className="flex-1 border rounded px-2 py-1 bg-white dark:bg-gray-700">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex items-center px-2">→</div>
                    <select value={currency.to} onChange={(e) => currency.setTo(e.target.value)} className="flex-1 border rounded px-2 py-1 bg-white dark:bg-gray-700">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input type="number" value={currency.amount} onChange={(e) => currency.setAmount(e.target.value)} className="flex-1 border rounded px-2 py-1 bg-white dark:bg-gray-700" />
                    <button onClick={() => currency.fetchRateAndConvert()} className="bg-blue-500 text-white px-3 rounded hover:bg-blue-600">تحويل</button>
                  </div>

                  <div className="text-sm">
                    {currency.loading ? <span>جارٍ التحويل...</span> : currency.error ? <span className="text-red-500">{currency.error}</span> : currency.result ? (
                      <div>
                        <div className="font-semibold text-lg">
                          {Number(currency.amount).toLocaleString()} {currency.from} = {Number(currency.result).toLocaleString()} {currency.to}
                        </div>
                        {currency.rate !== null && <div className="text-xs text-gray-500 mt-1">سعر الصرف: 1 {currency.from} = {currency.rate} {currency.to}</div>}
                      </div>
                    ) : <span>ادخل مبلغًا صالحًا</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* history modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">سجل العمليات</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-sm text-gray-500">إغلاق</button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {calc.history.length === 0 ? <div className="text-gray-500 text-center">لا يوجد سجلات بعد</div> : calc.history.map((h, i) => (
                  <div key={i} className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                    <div className="text-xs text-gray-400">{h.expr}</div>
                    <div className="font-medium">{h.result}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { calc.setHistory([]); setShowHistoryModal(false); }} className="flex-1 bg-red-500 text-white py-2 rounded">مسح الكل</button>
                <button onClick={() => setShowHistoryModal(false)} className="flex-1 bg-gray-200 py-2 rounded">إغلاق</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
