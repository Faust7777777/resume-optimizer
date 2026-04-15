import { DiagnosisResult, ResumeScores, DiagnosisSuggestion, JDAnalysis, InterviewQuestion } from "@/types";

// 模拟诊断结果
export function mockDiagnosisResult(): DiagnosisResult {
  return {
    scores: {
      completeness: 78,
      relevance: 65,
      professionalism: 82,
      layout: 70,
      overall: 74,
    },
    suggestions: [
      {
        id: "1",
        category: "completeness",
        priority: "high",
        title: "缺少项目成果量化描述",
        description: "建议在项目经验中添加具体的量化指标，如'提升性能30%'、'服务100万+用户'等",
        action: "补充量化数据",
      },
      {
        id: "2",
        category: "relevance",
        priority: "high",
        title: "技能栈描述过于宽泛",
        description: "当前技能列表过于笼统，建议针对目标岗位突出相关技术栈",
        action: "优化技能描述",
      },
      {
        id: "3",
        category: "professionalism",
        priority: "medium",
        title: "部分用词不够专业",
        description: "建议使用更专业的行业术语，避免口语化表达",
        action: "使用专业术语",
      },
      {
        id: "4",
        category: "layout",
        priority: "medium",
        title: "段落间距不一致",
        description: "建议统一各模块的间距和排版风格",
        action: "调整排版",
      },
      {
        id: "5",
        category: "completeness",
        priority: "low",
        title: "缺少个人简介",
        description: "建议添加简短的个人简介，突出核心优势",
        action: "添加个人简介",
      },
    ],
    summary: "简历整体质量良好，但在量化描述和岗位匹配度方面有提升空间。建议重点补充项目成果数据，优化技能栈描述。",
  };
}

// 模拟JD分析结果
export function mockJDAnalysis(): JDAnalysis {
  return {
    keywords: [
      "React", "TypeScript", "Node.js", "微前端", "性能优化",
      "团队协作", "敏捷开发", "Git", "CI/CD", "测试驱动开发"
    ],
    matchedKeywords: ["React", "TypeScript", "Git", "团队协作"],
    missingKeywords: ["Node.js", "微前端", "性能优化", "CI/CD", "测试驱动开发"],
    suggestions: [
      {
        type: "add",
        content: "补充Node.js后端开发经验",
        reason: "JD中明确要求全栈开发能力",
      },
      {
        type: "highlight",
        content: "强调性能优化相关经验",
        reason: "岗位重视性能优化能力",
      },
      {
        type: "modify",
        content: "将'团队合作'改为'敏捷开发实践'",
        reason: "更贴合JD描述",
      },
    ],
  };
}

// 模拟AI润色结果（STAR法则转换）
export function mockAIPolish(originalText: string): string {
  // 模拟将普通描述转换为STAR法则
  const starExamples: Record<string, string> = {
    "负责前端开发": "**S**ituation: 公司需要重构老旧后台管理系统。\n**T**ask: 我负责前端技术选型和核心模块开发。\n**A**ction: 采用React+TypeScript技术栈，设计了组件化架构，实现了权限管理系统。\n**R**esult: 项目按时上线，代码可维护性提升50%，获得团队好评。",
    "优化网站性能": "**S**ituation: 网站首屏加载时间超过5秒，用户流失率高。\n**T**ask: 我负责性能优化专项。\n**A**ction: 通过代码分割、懒加载、CDN优化等手段进行系统优化。\n**R**esult: 首屏时间降至1.2秒，性能评分从45分提升至92分。",
  };

  // 查找匹配或返回通用模板
  for (const [key, value] of Object.entries(starExamples)) {
    if (originalText.includes(key)) {
      return value;
    }
  }

  return `**S**ituation: 项目背景描述...\n**T**ask: 我的职责...\n**A**ction: 采取的行动...\n**R**esult: 取得的成果（建议添加量化数据）`;
}

// 模拟面试题目生成
export function mockInterviewQuestions(): InterviewQuestion[] {
  return [
    {
      id: "1",
      type: "technical",
      question: "请详细介绍一下你在React项目中遇到的最复杂的状态管理问题，以及你是如何解决的？",
      context: "基于简历中的React经验",
    },
    {
      id: "2",
      type: "behavioral",
      question: "描述一次你与产品经理意见不一致的经历，你是如何处理的？",
      context: "考察团队协作能力",
    },
    {
      id: "3",
      type: "scenario",
      question: "如果线上出现一个影响用户的紧急Bug，但刚好是周五晚上，你会怎么处理？",
      context: "考察应急处理能力",
    },
    {
      id: "4",
      type: "technical",
      question: "你如何理解微前端架构？在什么场景下会考虑使用？",
      context: "基于JD中的微前端要求",
    },
  ];
}

// 模拟面试反馈
export function mockInterviewFeedback(answer: string): { score: number; feedback: string } {
  const length = answer.length;
  if (length < 50) {
    return {
      score: 60,
      feedback: "回答较为简短，建议展开说明具体细节和思路过程。",
    };
  } else if (length < 150) {
    return {
      score: 75,
      feedback: "回答较为完整，但可以进一步补充量化结果和反思总结。",
    };
  } else {
    return {
      score: 88,
      feedback: "回答结构清晰，内容详实。建议在STAR法则中的Result部分更加突出量化成果。",
    };
  }
}

// 获取优先级颜色
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    case "medium":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "low":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

// 获取分类标签
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    completeness: "完整度",
    relevance: "相关性",
    professionalism: "专业性",
    layout: "排版",
  };
  return labels[category] || category;
}

// 获取分类颜色
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    completeness: "#3b82f6", // blue
    relevance: "#10b981",    // green
    professionalism: "#8b5cf6", // purple
    layout: "#f59e0b",       // orange
  };
  return colors[category] || "#6b7280";
}
