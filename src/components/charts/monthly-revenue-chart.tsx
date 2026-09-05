"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type MonthlyPoint = {
  month: string;
  due: number;
  collected: number;
};

export function MonthlyRevenueChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `₹${value}`} />
          <Legend />
          <Bar dataKey="due" name="Due" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}