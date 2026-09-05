"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type MonthlyPoint = {
  month: string;
  due: number;
  collected: number;
};

export function MonthlyRevenueChart({ data }: { data: MonthlyPoint[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    collected: d.collected,
    outstanding: Math.max(d.due - d.collected, 0),
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `₹${value}`} />
          <Legend />
          <Bar dataKey="collected" name="Collected" stackId="fees" fill="#0f172a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="outstanding" name="Outstanding" stackId="fees" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}