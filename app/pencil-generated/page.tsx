export default function PencilGeneratedPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <section className="mx-auto w-full max-w-[375px] rounded-[16px] bg-[#F3F4F6] p-4">
        <div className="mb-3 rounded-[12px] bg-white p-3">
          <h1 className="text-[22px] font-bold text-[#111827]">简历优化助手</h1>
          <p className="mt-1 text-[12px] text-[#6B7280]">输入岗位和简历内容，一键生成优化建议</p>
        </div>

        <label className="mb-1 block text-[13px] font-semibold text-[#111827]">目标岗位</label>
        <div className="mb-3 h-[44px] rounded-[10px] bg-white px-3 py-3 text-[13px] text-[#6B7280]">
          例如：前端开发工程师
        </div>

        <label className="mb-1 block text-[13px] font-semibold text-[#111827]">原始简历</label>
        <div className="mb-3 h-[180px] rounded-[10px] bg-white px-3 py-3 text-[13px] text-[#6B7280]">
          粘贴你的简历内容...
        </div>

        <button
          type="button"
          className="mb-3 flex h-[46px] w-full items-center justify-center rounded-[10px] bg-[#2563EB] text-[15px] font-semibold text-white"
        >
          开始优化
        </button>

        <h2 className="mb-2 text-[13px] font-semibold text-[#111827]">优化结果</h2>

        <article className="mb-3 h-[86px] rounded-[10px] bg-white p-[10px] text-[13px] text-[#374151]">
          1) 关键词补强：补充岗位关键词，提高匹配度。
        </article>

        <article className="mb-3 h-[86px] rounded-[10px] bg-white p-[10px] text-[13px] text-[#374151]">
          2) 项目重写：突出结果，加入可量化成果。
        </article>

        <article className="h-[86px] rounded-[10px] bg-white p-[10px] text-[13px] text-[#374151]">
          3) STAR 建议：按情境/任务/行动/结果组织经历。
        </article>
      </section>
    </main>
  );
}
