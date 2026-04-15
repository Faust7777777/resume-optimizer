import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/polish
 * AI润色：将文本转换为STAR法则
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const polishedText = await polishWithAI(text);

    return NextResponse.json({ polishedText });
  } catch (error) {
    console.error("Polish error:", error);
    return NextResponse.json(
      { error: "Failed to polish text" },
      { status: 500 }
    );
  }
}

/**
 * 调用大模型进行润色
 */
async function polishWithAI(originalText: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  // 如果没有配置API Key，返回模拟数据
  if (!apiKey) {
    console.log("No API key found, returning mock polish");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getMockPolish(originalText);
  }

  const prompt = `你是一位专业的简历顾问。请将以下工作经历描述转换为STAR法则格式：

原始描述：
${originalText}

要求：
1. S (Situation): 项目背景
2. T (Task): 你的任务/职责
3. A (Action): 采取的行动（具体、可量化）
4. R (Result): 取得的成果（必须包含量化数据）

请直接返回润色后的文本，使用Markdown格式标注STAR各部分。`;

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
            "你是一位专业的简历顾问，擅长用STAR法则优化工作经历描述。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 模拟润色结果
 */
function getMockPolish(originalText: string): string {
  const starExamples: Record<string, string> = {
    负责前端开发:
      "**S**ituation: 公司需要重构老旧后台管理系统，原有系统性能差、维护困难。\n\n**T**ask: 我负责前端技术选型和核心模块开发，需要在一季度内完成重构。\n\n**A**ction: 采用React+TypeScript技术栈，设计了组件化架构，实现了权限管理系统，引入自动化测试。\n\n**R**esult: 项目按时上线，页面加载速度提升60%，代码可维护性提升50%，获得团队好评。",
    优化网站性能:
      "**S**ituation: 网站首屏加载时间超过5秒，用户流失率高达40%，影响业务转化。\n\n**T**ask: 我负责性能优化专项，目标是将首屏时间降至2秒以内。\n\n**A**ction: 通过代码分割、懒加载、CDN优化、图片压缩等手段进行系统优化，实施性能监控体系。\n\n**R**esult: 首屏时间降至1.2秒，性能评分从45分提升至92分，用户流失率降低25%。",
  };

  // 查找匹配
  for (const [key, value] of Object.entries(starExamples)) {
    if (originalText.includes(key)) {
      return value;
    }
  }

  return `**S**ituation: 项目背景描述（建议补充项目规模、技术栈等）\n\n**T**ask: 我的职责和任务（建议具体说明负责范围）\n\n**A**ction: 采取的行动（建议添加具体技术手段和方法）\n\n**R**esult: 取得的成果（强烈建议添加量化数据，如提升XX%、节省XX时间等）`;
}
