import { NextRequest, NextResponse } from "next/server";
import { DiagnosisResult } from "@/types";

/**
 * POST /api/analyze
 * 分析简历内容，返回四维度评分和建议
 */
export async function POST(request: NextRequest) {
  try {
    const { resumeContent } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: "Resume content is required" },
        { status: 400 }
      );
    }

    // 调用大模型进行简历分析
    // 生产环境：调用 OpenAI/Claude/文心一言等
    // 开发环境：返回模拟数据

    const result: DiagnosisResult = await analyzeWithAI(resumeContent);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
}

/**
 * 调用大模型分析简历
 */
async function analyzeWithAI(resumeContent: string): Promise<DiagnosisResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // 如果没有配置API Key，返回模拟数据（开发环境）
  if (!apiKey) {
    console.log("No API key found, returning mock data");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟延迟
    return getMockResult();
  }

  // 生产环境：调用 OpenAI
  const prompt = `你是一位专业的简历顾问。请分析以下简历内容，从四个维度进行评分并给出建议：

简历内容：
${resumeContent}

请按以下JSON格式返回：
{
  "scores": {
    "completeness": 0-100,
    "relevance": 0-100,
    "professionalism": 0-100,
    "layout": 0-100
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
1. 分数要客观准确，基于简历实际质量
2. 建议要具体可操作
3. 返回必须是合法的JSON格式，不要包含其他文字`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的简历顾问，擅长分析简历质量并给出改进建议。请严格按JSON格式返回。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 提取JSON部分
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from AI");
  }

  const result = JSON.parse(jsonMatch[0]) as DiagnosisResult;

  // 计算总分
  result.scores.overall = Math.round(
    (result.scores.completeness +
      result.scores.relevance +
      result.scores.professionalism +
      result.scores.layout) /
      4
  );

  return result;
}

/**
 * 模拟数据（开发环境使用）
 */
function getMockResult(): DiagnosisResult {
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
        description:
          "建议在项目经验中添加具体的量化指标，如'提升性能30%'、'服务100万+用户'等",
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
    summary:
      "简历整体质量良好，但在量化描述和岗位匹配度方面有提升空间。建议重点补充项目成果数据，优化技能栈描述。",
  };
}
