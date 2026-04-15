// 简历评分类型
export interface ResumeScores {
  completeness: number;  // 完整度
  relevance: number;     // 相关性
  professionalism: number; // 专业性
  layout: number;        // 排版
  overall: number;       // 总分
}

// 编辑历史类型
export interface EditHistory {
  id: string;
  timestamp: Date;
  type: 'ai_polish' | 'manual_edit' | 'jd_match';
  description: string;
  diff: string;
  scoresBefore: ResumeScores;
  scoresAfter: ResumeScores;
}

// 简历类型
export interface Resume {
  id: string;
  title: string;
  content: string;  // Markdown 格式
  createdAt: Date;
  updatedAt: Date;
  scores?: ResumeScores;
  history?: EditHistory[];
}

// JD 分析类型
export interface JDAnalysis {
  keywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Suggestion[];
}

// 建议类型
export interface Suggestion {
  type: 'add' | 'modify' | 'highlight';
  content: string;
  reason: string;
}

// 诊断结果类型 — 匹配"资深简历优化专家"4步工作流
export interface DiagnosisResult {
  // 保留旧字段 (向后兼容)
  scores: ResumeScores;
  suggestions: DiagnosisSuggestion[];
  summary: string;

  // === 新增：4 步结构化分析 ===
  /** 原始 Markdown 全文（reasoning_content 原文） */
  rawAnalysis?: string;
  /** 解析后的 4 步结构 */
  steps?: {
    /** Step 1: 岗位核心痛点解析 */
    jdAnalysis?: string;
    /** Step 2: 简历全科诊断 */
    diagnosis?: string;
    /** Step 3: 逐条重构与精修 */
    reconstruction?: string;
    /** Step 4: 简历模块优化与高阶建议 */
    moduleOptimization?: string;
  };
  /** Step 2 提取的匹配度评分 0-100 */
  matchScore?: number;
}

// 诊断建议类型
export interface DiagnosisSuggestion {
  id: string;
  category: 'completeness' | 'relevance' | 'professionalism' | 'layout';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

// 诊断历史记录
export interface DiagnosisHistory {
  id: string;
  timestamp: Date;
  fileName?: string;
  targetPosition?: string;
  scores: ResumeScores;
  matchScore?: number;
  summary: string;
  suggestions: DiagnosisSuggestion[];
  /** 原始 Markdown 全文（可选，用于重新查看） */
  rawAnalysis?: string;
}

// 导航项类型
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  description?: string;
}

// 面试题目类型
export interface InterviewQuestion {
  id: string;
  type: 'technical' | 'behavioral' | 'scenario';
  question: string;
  context?: string;
}

// 面试记录类型
export interface InterviewRecord {
  id: string;
  question: InterviewQuestion;
  answer: string;
  feedback: string;
  score: number;
}

// 面试会话类型
export interface InterviewSession {
  id: string;
  resumeId: string;
  jdText?: string;
  position?: string;
  startTime: Date;
  endTime?: Date;
  records: InterviewRecord[];
  overallScore?: number;
  summary?: string;
}

// 面试反馈类型
export interface InterviewFeedback {
  score: number;
  feedback: string;
}
