// src/components/SmartCalculatorProfessional.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, format as mathFormat } from "mathjs";
import { History, RefreshCw, ArrowLeftRight } from "lucide-react";

/**
 * SmartCalculatorProfessional.tsx
 * - React + TypeScript + Tailwind
 * - Uses mathjs for evaluation (precise, scientific)
 * - Single page with two tabs: Calculator (iOS-like) & Currency Converter (dropdowns)
 * - Mobile-first responsive layout
 */

/* --------------------------- Currencies --------------------------- */
const CURRENCIES = [
  "USD","EUR","GBP","JPY","EGP","AED","SAR","CAD","AUD","CHF","CNY","INR","KRW","TRY","BRL","ZAR"
] as const;
type CurrencyCode = (typeof CURRENCIES)[number];

const CURRENCY_NAMES: Record<string,string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  EGP: "Egyptian Pound", AED: "UAE Dirham", SAR: "Saudi Riyal",
  CAD: "Canadian Dollar", AUD: "Australian Dollar", CHF: "Swiss Franc",
  CNY: "Chinese Yuan", INR: "Indian Rupee", KRW: "South Korean Won",
  TRY: "Turkish Lira", BRL: "Brazilian Real", ZAR: "South African Rand",
};

const FLAG_EMOJI: Record<string,string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", EGP: "🇪🇬",
  AED: "🇦🇪", SAR: "🇸🇦", CAD: "🇨🇦", AUD: "🇦🇺", CHF: "🇨🇭",
  CNY: "🇨🇳", INR: "🇮🇳", KRW: "🇰🇷", TRY: "🇹🇷", BRL: "🇧🇷", ZAR: "🇿🇦",
};

function safeNumber(v: unknown) {
  return typeof v === "number" && isFinite(v);
}

/* ===================== useCalculator (mathjs) ===================== */
function useCalculator() {
  const [expr, setExpr] = useState<string>("");
  const [display, setDisplay] = useState<string>("0");
  const [history, setHistory] = useState<{expr:string;result:string}[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const fmt = (n: number) => {
    try {
      // use mathjs formatting for consistent precision
      return mathFormat(n, { precision: 14 });
    } catch {
      return String(n);
    }
  };

  const append = (s: string) => {
    setError("");
    setExpr((p) => {
      // avoid leading zero weirdness
      if (p === "0" && /^[0-9.]$/.test(s)) return s;
      return p + s;
    });
    setDisplay((p) => (p === "0" && /^[0-9.]$/.test(s) ? s : (p === "0" ? s : p + s)));
  };

  const clearAll = () => { setExpr(""); setDisplay("0"); setError(""); };
  const backspace = () => {
    setExpr((p) => {
      const next = p.slice(0,-1);
      setDisplay(next || "0");
      return next;
    });
  };

  const evaluateExpr = (input: string) => {
    const raw = (input || "").trim();
    if (!raw) return 0;
    // replace common symbols for user convenience
    let s = raw.replace(/×/g,"*").replace(/÷/g,"/").replace(/π/g,"pi").replace(/\^/g,"^");
    // percent: 50% => 0.5
    s = s.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    // safe check (allow letters for functions)
    if (!/^[0-9+\-*/()., _%A-Za-z^!]*$/.test(s)) {
      throw new Error("Unsafe characters");
    }
    // evaluate with mathjs
    try {
      const res = evaluate(s); // mathjs evaluate
      if (typeof res === "number") {
        if (!isFinite(res)) throw new Error("Math error");
        return res;
      }
      // mathjs may return BigNumber etc. convert to number if possible
      const num = Number(res as any);
      if (!isFinite(num)) throw new Error("Math error");
      return num;
    } catch (e:any) {
      throw new Error("Invalid expression");
    }
  };

  const evaluateAndStore = () => {
    try {
      const val = evaluateExpr(expr || display);
      const res = fmt(val);
      setDisplay(res);
      setExpr(res);
      setHistory((h) => [{expr: expr||display, result: res}, ...h].slice(0,200));
      setError("");
      return res;
    } catch (e:any) {
      setError(e?.message || "Invalid expression");
      setDisplay("Error");
      throw e;
    }
  };

  const toggleSign = () => {
    try {
      const v = evaluateExpr(expr || display);
      const neg = -v;
      const s = fmt(neg);
      setExpr(s);
      setDisplay(s);
      setError("");
    } catch {
      setError("Invalid");
    }
  };

  const memoryClear = () => setMemory(0);
  const memoryRecall = () => setExpr((p) => p + String(memory));
  const memoryAdd = () => {
    try { setMemory((m) => m + evaluateExpr(expr || display)); } catch { setError("Invalid"); }
  };
  const memorySub = () => {
    try { setMemory((m) => m - evaluateExpr(expr || display)); } catch { setError("Invalid"); }
  };

  return {
    expr, setExpr, display, setDisplay, history, setHistory, memory,
    error, setError, append, clearAll, backspace, evaluateAndStore, toggleSign,
    memoryClear, memoryRecall, memoryAdd, memorySub, fmt
  };
}

/* ===================== useCurrency (open.er-api fallback) ===================== */
function useCurrency() {
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>("EGP");
  const [amount, setAmount] = useState<string>("100");
  const [rate, setRate] = useState<number|null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const controllerRef = useRef<AbortController|null>(null);

  const fetchRateAndConvert = async (f = from, t = to, amt = parseFloat(amount)) => {
    setError("");
    if (!f || !t) return;
    if (isNaN(amt)) { setResult(""); return; }
    setLoading(true);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    try {
      const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(f)}`;
      const res = await fetch(url, { signal: controllerRef.current.signal });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const r = data?.rates?.[t];
      if (safeNumber(r)) {
        setRate(r);
        const conv = amt * r;
        setResult(conv.toString());
      } else {
        setRate(null);
        setResult("");
        setError("فشل في جلب سعر الصرف");
      }
    } catch (e:any) {
      if (e?.name === "AbortError") return;
      console.error(e);
      setError("خطأ في الاتصال أو في API");
      setResult("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(()=> fetchRateAndConvert(), 300);
    return () => clearTimeout(id);
  }, [from,to,amount]);

  const swap = () => {
    const old = from;
    setFrom(to);
    setTo(old);
    setTimeout(()=> fetchRateAndConvert(to, old, parseFloat(amount)), 0);
  };

  return { from, setFrom, to, setTo, amount, setAmount, rate, result, loading, error, fetchRateAndConvert, swap };
}

/* ===================== Main Component ===================== */
export default function SmartCalculatorProfessional(): JSX.Element {
  const [mode, setMode] = useState<"calculator"|"converter">("calculator");
  const [calcTab, setCalcTab] = useState<"standard"|"scientific"|"programmer">("standard");
  const [showHistory, setShowHistory] = useState(false);

  const calc = useCalculator();
  const currency = useCurrency();

  const scientificKeys = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "sqrt(", "log(", "ln(", "pow(", "pi", "e"];
  const programmerKeys = ["BIN","DEC","HEX","AND","OR","XOR","NOT"];
  const commonKeys = [
    ["MC","MR","M+","M-"],
    ["(",")","C","⌫"],
    ["7","8","9","÷"],
    ["4","5","6","×"],
    ["1","2","3","-"],
    ["±","0",".","+"],
    ["%","^","Ans","="]
  ];

  const handleCommon = (k: string) => {
    if (!k) return;
    switch(k) {
      case "C": calc.clearAll(); break;
      case "⌫": calc.backspace(); break;
      case "=": try { calc.evaluateAndStore(); } catch{} break;
      case "±": calc.toggleSign(); break;
      case "MC": calc.memoryClear(); break;
      case "MR": calc.memoryRecall(); break;
      case "M+": calc.memoryAdd(); break;
      case "M-": calc.memorySub(); break;
      case "Ans": if (calc.history[0]) calc.append(calc.history[0].result); break;
      default: calc.append(k);
    }
  };

  const handleScientific = (k: string) => {
    // for functions that need parentheses, append '(' if not present
    if (/(sin|cos|tan|asin|acos|atan|sqrt|log|ln|pow)\($/.test(k)) {
      calc.append(k);
      return;
    }
    // constants
    if (k === "pi") calc.append("pi");
    else if (k === "e") calc.append("e");
    else calc.append(k);
  };

  const handleProgrammer = (k: string) => {
    if (k === "BIN" || k === "DEC" || k === "HEX") {
      try {
        const num = Number(calc.expr || calc.display);
        if (isNaN(num)) throw new Error();
        if (k === "BIN") calc.setDisplay((num|0).toString(2));
        if (k === "DEC") calc.setDisplay(String(num));
        if (k === "HEX") calc.setDisplay((num|0).toString(16).toUpperCase());
        calc.setExpr(String(num));
      } catch { calc.setError("Invalid"); }
      return;
    }
    if (k === "AND") calc.append(" & ");
    if (k === "OR") calc.append(" | ");
    if (k === "XOR") calc.append(" xor ");
    if (k === "NOT") calc.append(" ~ ");
  };

  const filteredCurrencies = useMemo(()=> CURRENCIES, []);


  const formatNumberForDisplay = (v: string|number) => {
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  // show only ONE decimal digit
  const fixed = n.toFixed(1);
  const parts = fixed.split(".");
  parts[0] = Number(parts[0]).toLocaleString();
  parts[1] = parts[1].replace(/0+$/, ""); // remove trailing zeros
  return parts[1] ? `${parts[0]}.${parts[1]}` : parts[0];
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 flex items-start justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-xl p-4">
          {/* header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button onClick={() => setMode("calculator")} className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${mode==="calculator" ? "bg-white shadow-md dark:bg-gray-800 text-blue-600" : "bg-transparent text-gray-600 dark:text-gray-300"}`}>الآلة الحاسبة</button>
              <button onClick={() => setMode("converter")} className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${mode==="converter" ? "bg-white shadow-md dark:bg-gray-800 text-blue-600" : "bg-transparent text-gray-600 dark:text-gray-300"}`}>سعر الصرف</button>
            </div>

            <div className="flex items-center gap-2">
              <button title="سجل العمليات" onClick={() => setShowHistory(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"><History size={18} /></button>
            </div>
          </div>

          {/* body */}
          <div className="space-y-4">
            {mode === "calculator" ? (
              /* CALCULATOR */
              <div className="rounded-xl p-3 bg-white dark:bg-gray-800 shadow-inner">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setCalcTab("standard")} className={`flex-1 py-2 rounded-md text-sm font-medium ${calcTab==="standard" ? "bg-gradient-to-r from-white to-slate-100 dark:from-gray-700 dark:to-gray-700 shadow-md text-gray-800 dark:text-white" : "bg-transparent text-gray-600 dark:text-gray-300"}`}>عادي</button>
                  <button onClick={() => setCalcTab("scientific")} className={`flex-1 py-2 rounded-md text-sm font-medium ${calcTab==="scientific" ? "bg-gradient-to-r from-white to-slate-100 dark:from-gray-700 dark:to-gray-700 shadow-md text-gray-800 dark:text-white" : "bg-transparent text-gray-600 dark:text-gray-300"}`}>علمي</button>
                  <button onClick={() => setCalcTab("programmer")} className={`flex-1 py-2 rounded-md text-sm font-medium ${calcTab==="programmer" ? "bg-gradient-to-r from-white to-slate-100 dark:from-gray-700 dark:to-gray-700 shadow-md text-gray-800 dark:text-white" : "bg-transparent text-gray-600 dark:text-gray-300"}`}>مبرمج</button>
                </div>

                {/* display */}
                <div className="bg-white/60 dark:bg-gray-900/50 rounded-xl p-3 mb-2">
                  <div className="text-right text-xs text-gray-500 break-words">{calc.expr}</div>
                  <div className="text-right font-mono text-3xl sm:text-4xl font-semibold break-words">{calc.display}</div>
                  {calc.error && <div className="text-right text-red-500 text-sm mt-2">{calc.error}</div>}
                </div>

                {/* scientific / programmer rows */}
                {calcTab === "scientific" && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {scientificKeys.map((k)=>(
                      <button key={k} onClick={() => { 
                        // append with parentheses when function-like
                        if (/^(sin|cos|tan|asin|acos|atan|sqrt|log|ln|pow)\($/.test(k + "(")) {
                          calc.append(k);
                          return;
                        }
                        calc.append(k);
                      }} className="py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-700 dark:to-violet-700 text-indigo-700 dark:text-white shadow-sm">
                        {k}
                      </button>
                    ))}
                  </div>
                )}

                {calcTab === "programmer" && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {programmerKeys.map((k)=>(
                      <button key={k} onClick={() => handleProgrammer(k)} className="py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-800 dark:text-white shadow-sm">
                        {k}
                      </button>
                    ))}
                  </div>
                )}

                {/* keypad */}
                <div className="grid grid-cols-4 gap-2">
                  {commonKeys.flat().map((k,i)=>{
                    const isOp = ["+","-","×","÷","^","="].includes(k);
                    const isAction = ["C","⌫","MC","MR","M+","M-"].includes(k);
                    let baseClass = "py-3 rounded-2xl font-semibold text-sm shadow-md focus:outline-none";
                    if (k === "=") baseClass += " bg-gradient-to-br from-blue-600 to-indigo-600 text-white";
                    else if (isOp) baseClass += " bg-gradient-to-br from-blue-400 to-blue-500 text-white";
                    else if (isAction) baseClass += " bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
                    else baseClass += " bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200";
                    return (
                      <button key={`${k}-${i}`} onClick={() => handleCommon(k)} className={baseClass}>
                        {k}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CONVERTER */
              <div className="rounded-xl p-3 bg-white dark:bg-gray-800 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">محول العملات (احترافي)</div>
                  <div className="flex gap-2">
                    <button onClick={() => currency.fetchRateAndConvert()} title="تحديث" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={16} /></button>
                    <button onClick={() => currency.swap()} title="تبديل" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeftRight size={16} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-xs text-gray-500">المبلغ</label>
                    <input inputMode="decimal" value={currency.amount} onChange={(e)=>currency.setAmount(e.target.value)} className="mt-1 w-full rounded-xl p-3 bg-white dark:bg-gray-900/40 text-right"/>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">من</label>
                      <select value={currency.from} onChange={(e)=>currency.setFrom(e.target.value as CurrencyCode)} className="mt-1 w-full rounded-xl p-3 bg-white dark:bg-gray-900/40">
                        {filteredCurrencies.map(c => <option key={c} value={c}>{`${FLAG_EMOJI[c]} ${c} - ${CURRENCY_NAMES[c]}`}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">إلى</label>
                      <select value={currency.to} onChange={(e)=>currency.setTo(e.target.value as CurrencyCode)} className="mt-1 w-full rounded-xl p-3 bg-white dark:bg-gray-900/40">
                        {filteredCurrencies.map(c => <option key={c} value={c}>{`${FLAG_EMOJI[c]} ${c} - ${CURRENCY_NAMES[c]}`}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  {currency.loading ? (
                    <div className="text-sm text-gray-500">جارٍ التحويل...</div>
                  ) : currency.error ? (
                    <div className="text-sm text-red-500">{currency.error}</div>
                  ) : currency.result ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-2xl sm:text-3xl text-blue-700 dark:text-blue-300">
                        {`${formatNumberForDisplay(currency.amount)} ${currency.from} = ${formatNumberForDisplay(currency.result)} ${currency.to}`}
                      
                      
                      </div>
                      {currency.rate !== null && (
                        <div className="text-xs text-gray-500">{`1 ${currency.from} = ${formatNumberForDisplay(currency.rate)} ${currency.to}`}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">ادخل مبلغًا صالحًا ثم اضغط تحويل أو انتظر التحديث التلقائي</div>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <button onClick={() => currency.fetchRateAndConvert()} className="px-4 py-2 rounded-xl bg-blue-600 text-white">تحويل</button>
                </div>
              </div>
            )}
          </div>

          {/* history modal */}
          {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">سجل العمليات</h3>
                  <button onClick={() => setShowHistory(false)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">إغلاق</button>
                </div>
                <div className="space-y-2">
                  {calc.history.length === 0 ? <div className="text-gray-500 text-center">لا يوجد سجلات بعد</div> :
                    calc.history.map((h,i)=>(
                      <div key={i} className="p-2 rounded bg-gray-50 dark:bg-gray-900 flex justify-between">
                        <div className="text-xs text-gray-400">{h.expr}</div>
                        <div className="font-medium">{h.result}</div>
                      </div>
                    ))
                  }
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { calc.setHistory([]); setShowHistory(false);} } className="flex-1 bg-red-500 text-white py-2 rounded-xl">مسح الكل</button>
                  <button onClick={() => setShowHistory(false)} className="flex-1 bg-gray-200 py-2 rounded-xl">إغلاق</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
