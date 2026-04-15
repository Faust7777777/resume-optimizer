import { DiagnosisResult, JDAnalysis, InterviewQuestion, InterviewFeedback } from "@/types";

// AI 服务配置
interface AIServiceConfig {
  provider: "openai" | "anthropic" | "baidu" | "alibaba" | "mock";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// 当前配置 - 开发时使用 mock，生产时切换
const config: AIServiceConfig = {
  provider: (process.env.NEXT_PUBLIC_AI_PROVIDER as AIServiceConfig["provider"]) || "mock",
  apiKey: process.env.NEXT_PUBLIC_AI_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL,
  model: process.env.NEXT_PUBLIC_AI_MODEL,
};

// 统一的 AI 调用函数
async function callAI(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  if (config.provider === "mock") {
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "[模拟响应]";
  }

  // OpenAI 格式
  if (config.provider === "openai") {
    const response = await fetch(config.baseUrl || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Anthropic (Claude) 格式
  if (config.provider === "anthropic") {
    const response = await fetch(config.baseUrl || "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-3-sonnet-20240229",
        max_tokens: options?.maxTokens ?? 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

/**
 * 简历诊断 - 调用大模型分析简历
 */
export async function analyzeResume(resumeContent: string): Promise<DiagnosisResult> {
  const prompt = `你是一位专业的简历顾问。请分析以下简历内容，从四个维度进行评分并给出建议：

简历内容：
${resumeContent}

请按以下JSON格式返回：
{
  "scores": {
    "completeness": 0-100,  // 完整度：信息是否完整
    "relevance": 0-100,     // 相关性：与目标岗位的匹配度
    "professionalism": 0-100, // 专业性：用词、格式是否专业
    "layout": 0-100         // 排版：视觉呈现效果
  },
  "suggestions": [
    {
      "id": "1",
      "category": "completeness|relevance|professionalism|layout",
      "priority": "high|medium|low",
      "title": "问题标题",
      "description": "详细描述",
      "action": "建议操作"
    }
  ],
  "summary": "总体评价"
}

注意：
1. 分数要客观准确
2. 建议要具体可操作
3. 返回必须是合法的JSON格式`;

  try {
    const response = await callAI(prompt, { temperature: 0.3 });
    // 提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DiagnosisResult;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Resume analysis failed:", error);
    // 失败时返回模拟数据
    return mockDiagnosisResult();
  }
}

/**
 * JD分析 - 提取关键词并匹配
 */
export async function analyzeJD(resumeContent: string, jdText: string): Promise<JDAnalysis> {
  const prompt = `你是一位HR专家。请分析以下简历和职位描述的匹配度：

简历内容：
${resumeContent}

职位描述(JD)：
${jdText}

请按以下JSON格式返回：
{
  "keywords": ["关键词1", "关键词2", ...],  // JD中的所有关键技能和要求
  "matchedKeywords": ["匹配的关键词"],       // 简历中已包含的关键词
  "missingKeywords": ["缺失的关键词"],       // 简历中缺失但JD要求的关键词
  "suggestions": [
    {
      "type": "add|modify|highlight",
      "content": "建议内容",
      "reason": "原因说明"
    }
  ]
}

注意：
1. 关键词要准确提取
2. 建议要具体可操作
3. 返回必须是合法的JSON格式`;

  try {
    const response = await callAI(prompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as JDAnalysis;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("JD analysis failed:", error);
    return mockJDAnalysis();
  }
}

/**
 * AI润色 - 将文本转换为STAR法则
 */
export async function polishWithSTAR(originalText: string): Promise<string> {
  const prompt = `你是一位专业的简历顾问。请将以下工作经历描述转换为STAR法则格式：

原始描述：
${originalText}

要求：
1. S (Situation): 项目背景
2. T (Task): 你的任务/职责
3. A (Action): 采取的行动
4. R (Result): 取得的成果（必须包含量化数据）

请直接返回润色后的文本，使用Markdown格式标注STAR各部分。`;

  try {
    return await callAI(prompt, { temperature: 0.5 });
  } catch (error) {
    console.error("Polish failed:", error);
    return mockAIPolish(originalText);
  }
}

/**
 * 生成面试题目
 */
export async function generateInterviewQuestions(
  resumeContent: string,
  jdText?: string,
  position?: string
): Promise<InterviewQuestion[]> {
  const prompt = `你是一位资深面试官。请根据以下简历和职位信息生成面试题目：

简历内容：
${resumeContent}

${jdText ? `职位描述：\n${jdText}\n` : ""}
${position ? `目标岗位：${position}\n` : ""}

请生成4-6道面试题，包含：
1. 技术题（基于简历中的技术栈）
2. 行为题（考察软技能）
3. 场景题（模拟实际工作场景）

按以下JSON格式返回：
[
  {
    "id": "1",
    "type": "technical|behavioral|scenario",
    "question": "面试题目",
    "context": "出题依据或考察点"
  }
]`;

  try {
    const response = await callAI(prompt, { temperature: 0.7 });
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewQuestion[];
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Question generation failed:", error);
    return mockInterviewQuestions();
  }
}

/**
 * 面试回答评分
 */
export async function evaluateInterviewAnswer(
  question: string,
  answer: string
): Promise<InterviewFeedback> {
  const prompt = `你是一位面试官。请评估以下面试回答：

面试题目：${question}

候选人回答：
${answer}

请按以下JSON格式返回：
{
  "score": 0-100,
  "feedback": "详细评价和建议"
}

评分标准：
- 90-100: 回答优秀，逻辑清晰，内容充实
- 70-89: 回答良好，但有提升空间
- 50-69: 回答一般，需要补充细节
- 0-49: 回答较差，需要重新组织`;

  try {
    const response = await callAI(prompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewFeedback;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Interview evaluation failed:", error);
    return mockInterviewFeedback(answer);
  }
}

// 模拟函数（原 ai-mock.ts 中的函数）
function mockDiagnosisResult(): DiagnosisResult {
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
        description: "建议在项目经验中添加具体的量化指标",
        action: "补充量化数据",
      },
    ],
    summary: "简历整体质量良好，但在量化描述方面有提升空间。",
  };
}

function mockJDAnalysis(): JDAnalysis {
  return {
    keywords: ["React", "TypeScript"],
    matchedKeywords: ["React"],
    missingKeywords: ["TypeScript"],
    suggestions: [],
  };
}

function mockAIPolish(originalText: string): string {
  return `**S**ituation: 项目背景...\n**T**ask: 我的任务...\n**A**ction: 采取的行动...\n**R**esult: 取得的成果`;
}

function mockInterviewQuestions(): InterviewQuestion[] {
  return [
    {
      id: "1",
      type: "technical",
      question: "请介绍一下你的技术栈？",
      context: "了解技术背景",
    },
  ];
}

function mockInterviewFeedback(answer: string): InterviewFeedback {
  return {
    score: 75,
    feedback: "回答较为完整，但可以进一步补充具体案例。",
  };
}

// InterviewFeedback 类型已在 types/index.ts 中定义，使用导入的类型
