"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ResumeScores } from "@/types";
import { getCategoryColor } from "@/lib/ai-mock";

interface RadarChartProps {
  scores: ResumeScores;
}

export function ScoreRadarChart({ scores }: RadarChartProps) {
  const data = [
    { subject: "完整度", A: scores.completeness, fullMark: 100 },
    { subject: "相关性", A: scores.relevance, fullMark: 100 },
    { subject: "专业性", A: scores.professionalism, fullMark: 100 },
    { subject: "排版", A: scores.layout, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="评分"
          dataKey="A"
          stroke="#2B3A67"
          strokeWidth={2}
          fill="#3b82f6"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// 对比雷达图 - 用于数据复盘
interface ComparisonRadarChartProps {
  beforeScores: ResumeScores;
  afterScores: ResumeScores;
}

export function ComparisonRadarChart({ beforeScores, afterScores }: ComparisonRadarChartProps) {
  const data = [
    { subject: "完整度", 优化前: beforeScores.completeness, 优化后: afterScores.completeness },
    { subject: "相关性", 优化前: beforeScores.relevance, 优化后: afterScores.relevance },
    { subject: "专业性", 优化前: beforeScores.professionalism, 优化后: afterScores.professionalism },
    { subject: "排版", 优化前: beforeScores.layout, 优化后: afterScores.layout },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="优化前"
          dataKey="优化前"
          stroke="#94a3b8"
          strokeWidth={2}
          fill="#94a3b8"
          fillOpacity={0.1}
        />
        <Radar
          name="优化后"
          dataKey="优化后"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="#3b82f6"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
