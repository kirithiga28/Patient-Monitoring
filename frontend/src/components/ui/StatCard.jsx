import React from "react";
import { Card, CardContent } from "./Card";

export function StatCard({ title, value, icon, change, changeType = "neutral", color = "blue", className = "", ...props }) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <Card className={`${className}`} {...props}>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block">
            {title}
          </span>
          <span className="text-2xl font-black text-white block tracking-tight">
            {value}
          </span>
          {change && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span
                className={`px-1.5 py-0.2 rounded border ${
                  changeType === "positive"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : changeType === "negative"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-slate-950 border-slate-850 text-slate-400"
                }`}
              >
                {change}
              </span>
              <span className="text-slate-500 uppercase">vs last shift</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border shadow-inner ${selectedColor}`}>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
