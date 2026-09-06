"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type MonthlyPoint = {
  month: string;
  due: number;
  collected: number;
};

export function MonthlyRevenueChart({ data }: { data: MonthlyPoint[] }) {
  const [style, setStyle] = useState<"stacked" | "side-by-side">("stacked");

  const stackedData = data.map((d) => ({
    month: d.month,
    collected: d.collected,
    outstanding: Math.max(d.due - d.collected, 0),
  }));

  return (
    <div>
      <div className="mb-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setStyle("stacked")}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            style === "stacked"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Stacked
        </button>
        <button
          type="button"
          onClick={() => setStyle("side-by-side")}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            style === "side-by-side"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Side by side
        </button>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          {style === "stacked" ? (
            <BarChart data={stackedData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="collected" name="Collected" stackId="fees" fill="#0f172a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="outstanding" name="Outstanding" stackId="fees" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="due" name="Due" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}