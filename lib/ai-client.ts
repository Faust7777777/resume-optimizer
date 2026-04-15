import { DiagnosisResult, JDAnalysis, InterviewQuestion, InterviewFeedback } from "@/types";

// 前端 AI 客户端 - 调用本地 API 路由
const API_BASE = "/api/ai";

async function callAPI(action: string, params: Record<string, unknown>) {
  // Coze 工作流含 OCR + 深度思考 LLM，通常约 2-3 分钟
  const controller = new AbortController();
  const timeoutMs = 4 * 60 * 1000; // 4 分钟（后端 3.5 分钟超时 + 上传/处理余量）
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...params }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API call failed");
    }

    const data = await response.json();
    return data.result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("请求超时，Coze 工作流未响应，请稍后重试");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

interface UploadedResumeFile {
  name: string;
  type: string;
  base64: string;
}

function parseDiagnosisResult(response: unknown): DiagnosisResult {
  if (typeof response === "object" && response !== null) {
    return response as DiagnosisResult;
  }

  if (typeof response === "string") {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DiagnosisResult;
    }
  }

  throw new Error("Invalid response format");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * 简历诊断 - 调用大模型分析简历
 */
export async function analyzeResume(resumeContent: string): Promise<DiagnosisResult> {
  try {
    const response = await callAPI("diagnose", { resumeContent });
    return parseDiagnosisResult(response);
  } catch (error) {
    console.error("Resume analysis failed:", error);
    throw error;
  }
}

/**
 * 简历诊断（文件直传）- 上传后直接交给后端转发到工作流
 */
export async function analyzeResumeByFile(file: File, targetPosition = ""): Promise<DiagnosisResult> {
  try {
    const resumeFile: UploadedResumeFile = {
      name: file.name,
      type: file.type,
      base64: arrayBufferToBase64(await file.arrayBuffer()),
    };

    const response = await callAPI("diagnose", {
      resumeFile,
      targetPosition,
    });

    return parseDiagnosisResult(response);
  } catch (error) {
    console.error("File-based resume analysis failed:", error);
    throw error;
  }
}

/**
 * JD分析 - 提取关键词并匹配
 */
export async function analyzeJD(resumeContent: string, jdText: string): Promise<JDAnalysis> {
  try {
    const response = await callAPI("analyzeJD", { resumeContent, jdText });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as JDAnalysis;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("JD analysis failed:", error);
    throw error;
  }
}

/**
 * AI润色 - 将文本转换为STAR法则
 */
export async function polishWithSTAR(originalText: string): Promise<string> {
  try {
    return await callAPI("polish", { text: originalText });
  } catch (error) {
    console.error("Polish failed:", error);
    throw error;
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
  try {
    const response = await callAPI("generateQuestions", { resumeContent, jdText, position });
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewQuestion[];
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Question generation failed:", error);
    throw error;
  }
}

/**
 * 面试回答评分
 */
export async function evaluateInterviewAnswer(
  question: string,
  answer: string
): Promise<InterviewFeedback> {
  try {
    const response = await callAPI("evaluateAnswer", { question, answer });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InterviewFeedback;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Interview evaluation failed:", error);
    throw error;
  }
}
