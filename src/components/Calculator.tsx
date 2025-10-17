import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Divide, X, Minus, Plus, Equal } from "lucide-react";

export default function Calculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const handleClick = (value: string) => {
    if (value === "C") {
      setInput("");
      setResult("");
      return;
    }

    if (value === "=") {
      try {
        const evalResult = eval(input.replace("×", "*").replace("÷", "/"));
        setResult(evalResult);
      } catch {
        setResult("Error");
      }
      return;
    }

    setInput(input + value);
  };

  const buttons = [
    "C", "(", ")", "÷",
    "7", "8", "9", "×",
    "4", "5", "6", "-",
    "1", "2", "3", "+",
    "0", ".", "=",
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <Card className="w-80 rounded-2xl shadow-2xl bg-slate-950/70 backdrop-blur-lg border border-slate-700">
        <CardContent className="p-4">
          <div className="mb-4 text-right">
            <div className="text-lg text-slate-400">{input || "0"}</div>
            <div className="text-2xl font-bold text-white">{result}</div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {buttons.map((btn) => (
              <Button
                key={btn}
                variant="outline"
                className={`rounded-xl py-4 text-lg font-semibold transition-all ${
                  btn === "="
                    ? "col-span-1 bg-blue-600 text-white hover:bg-blue-700"
                    : btn === "C"
                    ? "text-red-400 border-red-500 hover:bg-red-500/20"
                    : "text-white border-slate-600 hover:bg-slate-700"
                }`}
                onClick={() => handleClick(btn)}
              >
                {btn === "÷" ? <Divide /> : 
                 btn === "×" ? <X /> : 
                 btn === "-" ? <Minus /> : 
                 btn === "+" ? <Plus /> : 
                 btn === "=" ? <Equal /> : btn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
