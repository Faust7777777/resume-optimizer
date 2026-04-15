"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ResumeScores } from "@/types";

interface RadarComparisonProps {
  before: ResumeScores;
  after: ResumeScores;
}

export function RadarComparison({ before, after }: RadarComparisonProps) {
  const data = [
    {
      dimension: "完整度",
      before: before.completeness,
      after: after.completeness,
    },
    {
      dimension: "相关性",
      before: before.relevance,
      after: after.relevance,
    },
    {
      dimension: "专业性",
      before: before.professionalism,
      after: after.professionalism,
    },
    {
      dimension: "排版",
      before: before.layout,
      after: after.layout,
    },
    {
      dimension: "总分",
      before: before.overall,
      after: after.overall,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
        <Radar
          name="优化前"
          dataKey="before"
          stroke="#94a3b8"
          fill="#94a3b8"
          fillOpacity={0.2}
        />
        <Radar
          name="优化后"
          dataKey="after"
          stroke="var(--color-primary, #2563EB)"
          fill="var(--color-primary, #2563EB)"
          fillOpacity={0.4}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
