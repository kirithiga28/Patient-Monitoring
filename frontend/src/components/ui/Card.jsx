import React from "react";

export function Card({ children, className = "", onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-xl transition-all duration-300 ${
        onClick ? "cursor-pointer hover:border-slate-700 hover:shadow-2xl hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`p-6 pb-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`text-base font-extrabold text-white tracking-wide ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-xs text-slate-400 mt-1 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
