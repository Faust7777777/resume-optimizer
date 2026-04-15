"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, animated = true }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "var(--success, #10b981)";
    if (s >= 60) return "var(--primary, #2563eb)";
    if (s >= 40) return "var(--warning, #f59e0b)";
    return "var(--destructive, #ef4444)";
  };

  const color = getScoreColor(score);
  const trackColor = "var(--border, #e2e8f0)";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`得分 ${score} 分（满分 100 分）`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{
          "--ring-circumference": `${circumference}`,
          "--ring-offset": `${offset}`,
        } as React.CSSProperties}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          style={animated ? {
            animation: "scoreRingFill 1s ease-out 0.2s forwards",
          } as React.CSSProperties : undefined}
          className="transition-[stroke-dashoffset]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold text-foreground"
          style={{ fontSize: size > 80 ? '1.5rem' : size > 50 ? '1rem' : '0.75rem' }}
        >
          {score}
        </span>
        {size > 60 && (
          <span className="text-xs text-muted-foreground">分</span>
        )}
      </div>
    </div>
  );
}
