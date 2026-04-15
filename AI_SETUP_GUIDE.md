# AI 大模型接入指南

## 快速开始

### 1. 创建配置文件

复制示例文件：
```bash
cp .env.local.example .env.local
```

### 2. 选择 AI 提供商并配置

编辑 `.env.local` 文件，选择一种 AI 提供商并填入 API Key。你提供的 Kimi API 已自动配置：

#### 选项 A: OpenAI / GPT (推荐)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
```

**获取 API Key:**
1. 访问 https://platform.openai.com
2. 注册/登录账号
3. 进入 API Keys 页面创建新密钥
4. 复制密钥到配置文件中

#### 选项 B: Claude / Anthropic
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

**获取 API Key:**
1. 访问 https://console.anthropic.com
2. 申请 API 访问权限
3. 创建 API Key

#### 选项 C: 阿里通义千问 (国内推荐)
```env
AI_PROVIDER=alibaba
ALIBABA_API_KEY=sk-your-dashscope-key
ALIBABA_MODEL=qwen-max
```

**获取 API Key:**
1. 访问 https://dashscope.aliyun.com
2. 使用阿里云账号登录
3. 创建 API Key
4. 新用户有免费额度

#### 选项 D: DeepSeek (性价比高)
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_MODEL=deepseek-chat
```

**获取 API Key:**
1. 访问 https://platform.deepseek.com
2. 注册账号
3. 创建 API Key
4. 价格相对便宜

#### 选项 E: 智谱 AI (GLM-4)
```env
AI_PROVIDER=zhipu
ZHIPU_API_KEY=your-zhipu-api-key
ZHIPU_MODEL=glm-4
```

**获取 API Key:**
1. 访问 https://open.bigmodel.cn
2. 注册并实名认证
3. 创建 API Key
4. 新用户有免费额度

#### 选项 F: Kimi (Moonshot)
```env
AI_PROVIDER=kimi
KIMI_API_KEY=sk-your-kimi-key
KIMI_MODEL=moonshot-v1-8k
# KIMI_BASE_URL=https://api.moonshot.cn/v1  # 可选，使用第三方代理时修改
```

**获取 API Key:**
1. 访问 https://platform.moonshot.cn
2. 注册账号
3. 创建 API Key
4. 新用户有免费额度

#### 选项 G: Coze 工作流（你本地 projects）
```env
AI_PROVIDER=coze
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TOKEN=your-token-if-needed
COZE_WORKFLOW_ID=你的已发布工作流ID
COZE_WORKFLOW_FILE_PARAM=resume_file
COZE_WORKFLOW_TEXT_PARAM=resume_content
COZE_WORKFLOW_JOB_PARAM=target_position
```

说明：
1. 当前项目会在后端先调用 Coze 上传文件 API，再调用工作流 API（`/v1/workflow/run`）。
2. 调用该链路的 token 需要至少具备 `uploadFile` 和 `run` 权限。
3. `COZE_WORKFLOW_ID` 必须是已发布工作流，否则会报 4200。
4. 若你的工作流入参名不是 `resume_file/target_position`，请用 `COZE_WORKFLOW_FILE_PARAM`、`COZE_WORKFLOW_JOB_PARAM` 对齐。

### 3. 重启服务器

修改配置后需要重启开发服务器：
```bash
npm run dev
```

## 功能验证

启动后，打开 http://localhost:3000/diagnosis

1. 上传简历或点击"开始诊断"
2. 如果配置正确，会调用真实 AI 进行分析
3. 分析结果会有轻微延迟（2-5秒）

## 常见问题

### Q: API Key 泄露了怎么办？
A: `.env.local` 文件不会被提交到 git（已在 .gitignore 中配置）。如果不慎泄露，立即到对应平台撤销并重新生成 API Key。
****
### Q: 如何切换不同的 AI 提供商？
A: 修改 `.env.local` 中的 `AI_PROVIDER` 值，并配置对应的 API Key，然后重启服务器。

### Q: 国内访问 OpenAI 有困难？
A: 可以使用以下方案：
1. 使用国内代理服务（如 API2D、CloseAI 等）
2. 修改 `OPENAI_BASE_URL` 为代理地址
3. 或者使用国内大模型（通义千问、DeepSeek、智谱等）

### Q: 费用如何？
A: 不同提供商价格不同：
- OpenAI GPT-4: ~$0.03/1K tokens
- Claude 3: ~$0.03/1K tokens
- 阿里通义千问: 新用户免费额度 100万 tokens
- DeepSeek: ~￥0.01/1K tokens
- 智谱 GLM-4: 新用户免费额度
- Kimi: 新用户免费额度

简历分析一次大约消耗 500-1000 tokens。

### Q: 如何查看 API 调用日志？
A: 查看浏览器开发者工具的 Network 面板，可以看到对 `/api/ai` 的调用请求。

## 技术架构

```
用户界面 (React)
    ↓
前端组件调用 ai-client.ts
    ↓
发送请求到 /api/ai (Next.js API Route)
    ↓
后端路由根据配置调用真实 AI API
    ↓
返回结果到前端展示
```

**为什么这样设计？**
1. **安全性**: API Key 存储在服务端环境变量，不会暴露给前端
2. **灵活性**: 可以在服务端统一处理错误、重试、日志等
3. **可扩展**: 容易添加新的 AI 提供商而无需修改前端代码

## 支持的模型推荐

| 用途 | 推荐模型 | 说明 |
|------|---------|------|
| 简历诊断 | gpt-4o, claude-3-sonnet, qwen-max | 需要较强的分析能力 |
| JD匹配 | gpt-4o-mini, deepseek-chat, glm-4 | 性价比高 |
| AI润色 | gpt-4o, claude-3-sonnet | 需要创意写作能力 |
| 面试题生成 | 任意模型均可 | 根据预算选择 |
| 回答评分 | gpt-4o, qwen-max | 需要准确评估 |

## 故障排除

如果 AI 功能不工作：

1. **检查环境变量**
   ```bash
   # 在终端中查看是否正确设置
   echo $AI_PROVIDER
   echo $OPENAI_API_KEY
   ```

2. **查看控制台错误**
   - 浏览器控制台（F12）
   - 终端运行的 Next.js 服务器日志

3. **验证 API Key 有效性**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

4. **检查网络连接**
   - 能否访问对应 AI 提供商的 API 地址
   - 是否需要代理

## 联系支持

如有问题，可以：
1. 查看各 AI 提供商的官方文档
2. 检查 Next.js 和 React 的错误日志
3. 参考本项目的 GitHub Issues

---

## 外部调用工作流（最终版）

### 你可以走两种入口

1. 调用你自己的部署入口（例如 `https://6qj6dh6fwj.coze.site/run`）
   - 入参通常是：`resume_file`（必填）+ `target_position`（可选）
   - 适合你自己封装好的项目接口

2. 调用 Coze 官方 OpenAPI（推荐）
   - 执行工作流：`POST https://api.coze.cn/v1/workflow/run`
   - 文件先上传：`POST https://api.coze.cn/v1/files/upload`
   - 适合外部系统稳定集成

### 官方 OpenAPI 必备条件

1. 工作流必须是**已发布**状态
2. Token 必须有对应权限：
   - 上传文件需要 `uploadFile`
   - 执行工作流需要 `run`
3. Token 必须有目标空间访问权限

### 官方 OpenAPI 参数说明（执行工作流）

- Header
  - `Authorization: Bearer <Access_Token>`
  - `Content-Type: application/json`

- Body
  - `workflow_id`：必填，已发布工作流 ID
  - `parameters`：工作流输入参数对象
  - 常见可选：`bot_id`、`app_id`、`is_async`

### 文件参数怎么传

如果工作流入参（如 `resume_file`）是文件类型，推荐：

1. 先调用上传接口拿 `file_id`
2. 在 `parameters` 里传：
   - `"resume_file": "{\"file_id\":\"xxxx\"}"`

### Python 示例（官方 OpenAPI）

```python
import json
import requests

TOKEN = "<YOUR_ACCESS_TOKEN>"
WORKFLOW_ID = "<YOUR_WORKFLOW_ID>"

# 1) 上传文件
with open("resume.pdf", "rb") as f:
    files = {"file": ("resume.pdf", f, "application/pdf")}
    data = {"data": json.dumps({})}
    r = requests.post(
        "https://api.coze.cn/v1/files/upload",
        headers={"Authorization": f"Bearer {TOKEN}"},
        data=data,
        files=files,
        timeout=60,
    )
    upload_result = r.json()

if upload_result.get("code") != 0:
    raise RuntimeError(upload_result)

file_id = upload_result["data"]["id"] if "id" in upload_result.get("data", {}) else upload_result["data"].get("file_id")

# 2) 执行工作流
payload = {
    "workflow_id": WORKFLOW_ID,
    "parameters": {
        "resume_file": json.dumps({"file_id": file_id}),
        "target_position": "高级前端工程师"
    }
}

r = requests.post(
    "https://api.coze.cn/v1/workflow/run",
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    },
    json=payload,
    timeout=90,
)

result = r.json()
print(result)
```

### 常见报错对照

- `4101`：权限不足（常见是缺 `uploadFile` 或 `run`）
- `4200`：工作流未发布
- `token invalid`：令牌类型不对或已失效

