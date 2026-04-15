import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resume, ResumeScores, JDAnalysis, EditHistory, InterviewSession, DiagnosisHistory } from '@/types';

interface ResumeStore {
  // 当前简历
  currentResume: Resume | null;
  setCurrentResume: (resume: Resume) => void;
  updateResumeContent: (content: string) => void;

  // 编辑器状态
  editorContent: string;
  setEditorContent: (content: string) => void;

  // 选中的文本（用于 AI 润色）
  selectedText: string;
  setSelectedText: (text: string) => void;

  // JD 分析结果
  jdAnalysis: JDAnalysis | null;
  setJdAnalysis: (analysis: JDAnalysis) => void;

  // 历史记录
  history: EditHistory[];
  addHistory: (item: EditHistory) => void;
  clearHistory: () => void;

  // 面试会话
  interviewSession: InterviewSession | null;
  setInterviewSession: (session: InterviewSession | null) => void;

  // 诊断结果
  diagnosisScores: ResumeScores | null;
  setDiagnosisScores: (scores: ResumeScores) => void;

  // 诊断历史
  diagnosisHistory: DiagnosisHistory[];
  addDiagnosisHistory: (item: DiagnosisHistory) => void;
  clearDiagnosisHistory: () => void;

  // 简历列表
  resumes: Resume[];
  addResume: (resume: Resume) => void;
  deleteResume: (id: string) => void;
}

const defaultResumeContent = "";

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      currentResume: null,
      editorContent: defaultResumeContent,
      selectedText: '',
      jdAnalysis: null,
      history: [],
      interviewSession: null,
      diagnosisScores: null,
      diagnosisHistory: [],
      resumes: [],

      setCurrentResume: (resume) => set({ currentResume: resume }),

      updateResumeContent: (content) => {
        set({ editorContent: content });
        const { currentResume } = get();
        if (currentResume) {
          set({
            currentResume: {
              ...currentResume,
              content,
              updatedAt: new Date(),
            },
          });
        }
      },

      setEditorContent: (content) => set({ editorContent: content }),

      setSelectedText: (text) => set({ selectedText: text }),

      setJdAnalysis: (analysis) => set({ jdAnalysis: analysis }),

      addHistory: (item) => set((state) => ({
        history: [item, ...state.history],
      })),

      clearHistory: () => set({ history: [] }),

      setInterviewSession: (session) => set({ interviewSession: session }),

      setDiagnosisScores: (scores) => set({ diagnosisScores: scores }),

      addDiagnosisHistory: (item) => set((state) => ({
        diagnosisHistory: [item, ...state.diagnosisHistory].slice(0, 50), // 最多保留 50 条
      })),
      clearDiagnosisHistory: () => set({ diagnosisHistory: [] }),

      addResume: (resume) => set((state) => ({
        resumes: [...state.resumes, resume],
      })),

      deleteResume: (id) => set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
      })),
    }),
    {
      name: 'resume-store',
    }
  )
);
