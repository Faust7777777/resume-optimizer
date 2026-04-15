"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ResumeScores } from "@/types";

interface ImprovementChartProps {
  before: ResumeScores;
  after: ResumeScores;
}

export function ImprovementChart({ before, after }: ImprovementChartProps) {
  const data = [
    {
      dimension: "完整度",
      improvement: after.completeness - before.completeness,
    },
    {
      dimension: "相关性",
      improvement: after.relevance - before.relevance,
    },
    {
      dimension: "专业性",
      improvement: after.professionalism - before.professionalism,
    },
    {
      dimension: "排版",
      improvement: after.layout - before.layout,
    },
    {
      dimension: "总分",
      improvement: after.overall - before.overall,
    },
  ];

  const getColor = (value: number) => {
    if (value >= 10) return "#22c55e"; // green
    if (value >= 5) return "#3b82f6"; // blue
    if (value > 0) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <YAxis domain={[-10, 30]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`${Number(value) > 0 ? "+" : ""}${value}分`, "提升"]
          }
        />
        <Bar dataKey="improvement" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.improvement)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
