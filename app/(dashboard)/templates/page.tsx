"use client";

import { useMemo, useState } from "react";
import { Search, Copy, Check, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Template = {
  id: string;
  industry: string;
  role: string;
  level: string;
  title: string;
  md: string;
};

const templates: Template[] = [
  {
    id: "t01",
    industry: "互联网",
    role: "前端工程师",
    level: "3-5年",
    title: "互联网｜前端工程师｜React",
    md: `# 张三\n\n## 求职意向\n- 前端工程师（React）\n- 城市：上海\n\n## 个人优势\n- 3年Web前端开发经验，熟悉 React + TypeScript + Next.js\n- 擅长性能优化与工程化建设，推动首屏性能和交付效率提升\n\n## 工作经历\n### 某电商平台｜前端工程师｜2023.03-至今\n- 主导商品详情页重构，首屏加载时间降低 32%，转化率提升 8%\n- 设计组件库规范并落地 28 个通用组件，开发效率提升 25%\n- 建立前端监控告警体系，线上故障发现时间缩短至 5 分钟\n\n## 项目经历\n### 大促会场性能优化\n- 通过代码分包、图片懒加载、SSR缓存策略，将LCP从 3.8s 优化至 2.1s\n- 在双11期间稳定支撑千万级PV\n\n## 教育背景\n- XX大学 计算机科学与技术 本科`,
  },
  {
    id: "t02",
    industry: "互联网",
    role: "后端工程师",
    level: "3-5年",
    title: "互联网｜后端工程师｜Java",
    md: `# 李四\n\n## 求职意向\n- Java后端工程师\n- 城市：杭州\n\n## 个人优势\n- 4年Java后端经验，熟悉Spring Boot、MySQL、Redis、Kafka\n- 具备高并发系统设计与服务治理实践\n\n## 工作经历\n### 某本地生活平台｜后端工程师｜2022.07-至今\n- 负责订单核心链路，峰值QPS提升至 8k，系统可用性 99.95%\n- 引入缓存分层策略，接口P95延迟降低 41%\n- 推动灰度发布流程，线上发布失败率下降 60%\n\n## 项目经历\n### 营销活动系统重构\n- 设计规则引擎与异步处理架构，活动配置效率提升 50%\n- 支撑百万人级并发抢券，故障率显著下降\n\n## 教育背景\n- XX大学 软件工程 本科`,
  },
  {
    id: "t03",
    industry: "互联网",
    role: "产品经理",
    level: "3-5年",
    title: "互联网｜产品经理｜增长方向",
    md: `# 王五\n\n## 求职意向\n- 增长产品经理\n- 城市：北京\n\n## 个人优势\n- 4年C端产品经验，擅长用户增长与数据驱动决策\n- 熟悉AARRR模型、漏斗分析和实验设计\n\n## 工作经历\n### 某内容平台｜产品经理｜2022.04-至今\n- 主导新用户激活链路优化，次日留存提升 6.2%\n- 推进推荐策略与Push策略联动，DAU提升 18%\n- 搭建指标看板，支持周级策略迭代\n\n## 项目经历\n### 新人引导系统改版\n- 通过行为分层与分路径引导，注册转化率提升 12%\n- 联动研发和运营，两周完成MVP上线\n\n## 教育背景\n- XX大学 信息管理与信息系统 本科`,
  },
  {
    id: "t04",
    industry: "互联网",
    role: "UI设计师",
    level: "1-3年",
    title: "互联网｜UI设计师｜移动端",
    md: `# 赵六\n\n## 求职意向\n- UI设计师（移动端）\n\n## 个人优势\n- 2年移动端UI设计经验，熟悉设计系统与可用性优化\n- 熟练使用Figma、Sketch、Principle\n\n## 工作经历\n### 某SaaS公司｜UI设计师｜2023.01-至今\n- 负责企业端App视觉改版，任务完成率提升 15%\n- 建立设计规范库，跨团队协作效率提升 30%\n\n## 项目经历\n### 运营后台改版\n- 重构信息层级与交互路径，关键流程点击步数减少 25%\n\n## 教育背景\n- XX美术学院 视觉传达设计 本科`,
  },
  {
    id: "t05",
    industry: "互联网",
    role: "运营专员",
    level: "1-3年",
    title: "互联网｜运营专员｜内容运营",
    md: `# 孙七\n\n## 求职意向\n- 内容运营\n\n## 个人优势\n- 2年内容运营经验，擅长选题策划与数据复盘\n- 熟悉小红书、抖音、公众号平台机制\n\n## 工作经历\n### 某教育品牌｜内容运营｜2023.02-至今\n- 策划月度专题内容，阅读量环比提升 35%\n- 建立内容评估模型，爆款命中率提升 22%\n\n## 项目经历\n### 短视频栏目孵化\n- 从0到1搭建栏目矩阵，3个月涨粉 8万\n\n## 教育背景\n- XX大学 新闻传播学 本科`,
  },
  {
    id: "t06",
    industry: "金融",
    role: "风控分析师",
    level: "3-5年",
    title: "金融｜风控分析师｜信贷方向",
    md: `# 周八\n\n## 求职意向\n- 风控分析师（信贷）\n\n## 个人优势\n- 4年风控模型与策略经验，熟悉贷前贷中贷后体系\n- 擅长SQL/Python建模与策略优化\n\n## 工作经历\n### 某消费金融公司｜风控分析师｜2021.08-至今\n- 优化反欺诈策略，坏账率下降 1.8pct\n- 搭建客群分层模型，审批通过率提升 9%\n\n## 项目经历\n### 反欺诈规则引擎升级\n- 联动数据与技术团队，规则命中准确率提升 20%\n\n## 教育背景\n- XX大学 金融工程 硕士`,
  },
  {
    id: "t07",
    industry: "金融",
    role: "投资经理",
    level: "5-8年",
    title: "金融｜投资经理｜一级市场",
    md: `# 吴九\n\n## 求职意向\n- 投资经理（一级市场）\n\n## 个人优势\n- 6年股权投资经验，覆盖TMT与硬科技赛道\n- 具备尽调、估值、投后管理全流程能力\n\n## 工作经历\n### 某创投机构｜投资经理｜2019.06-至今\n- 主导完成 12 个项目投资，2 个项目进入独角兽行列\n- 建立行业数据库，提升项目筛选效率 40%\n\n## 项目经历\n### 某AI企业投资项目\n- 主导尽调和投资条款谈判，投后一年营收增长 120%\n\n## 教育背景\n- XX大学 金融学 本科`,
  },
  {
    id: "t08",
    industry: "金融",
    role: "客户经理",
    level: "1-3年",
    title: "金融｜银行客户经理｜零售",
    md: `# 郑十\n\n## 求职意向\n- 银行零售客户经理\n\n## 个人优势\n- 3年零售金融服务经验，擅长客户经营与资产配置\n\n## 工作经历\n### 某股份制银行｜客户经理｜2022.01-至今\n- 维护中高净值客户 180+，AUM增长 32%\n- 推动理财与保险组合销售，交叉销售率提升 18%\n\n## 项目经历\n### 社区网点获客活动\n- 组织线上线下联动活动，月新增客户 260 户\n\n## 教育背景\n- XX财经大学 经济学 本科`,
  },
  {
    id: "t09",
    industry: "制造业",
    role: "生产经理",
    level: "5-8年",
    title: "制造业｜生产经理｜精益改善",
    md: `# 钱一\n\n## 求职意向\n- 生产经理\n\n## 个人优势\n- 7年制造现场管理经验，熟悉精益生产与6S管理\n\n## 工作经历\n### 某汽车零部件企业｜生产经理｜2018.03-至今\n- 推动产线平衡优化，产能提升 22%\n- 建立质量闭环机制，不良率下降 35%\n\n## 项目经历\n### 车间数字化改造\n- 导入MES系统，实现关键工序可视化追踪\n\n## 教育背景\n- XX理工大学 机械工程 本科`,
  },
  {
    id: "t10",
    industry: "制造业",
    role: "质量工程师",
    level: "3-5年",
    title: "制造业｜质量工程师｜汽车行业",
    md: `# 钱二\n\n## 求职意向\n- 质量工程师\n\n## 个人优势\n- 4年汽车制造质量管理经验，熟悉IATF16949\n\n## 工作经历\n### 某整车厂｜质量工程师｜2021.05-至今\n- 主导8D问题闭环，客户投诉率下降 28%\n- 建立SPC监控机制，过程能力指数稳定提升\n\n## 项目经历\n### 供应商质量改进项目\n- 推动关键供应商整改，来料不良率下降 40%\n\n## 教育背景\n- XX大学 材料成型及控制工程 本科`,
  },
  {
    id: "t11",
    industry: "制造业",
    role: "采购工程师",
    level: "3-5年",
    title: "制造业｜采购工程师｜供应链",
    md: `# 钱三\n\n## 求职意向\n- 采购工程师\n\n## 个人优势\n- 4年战略采购经验，擅长供应商管理与成本优化\n\n## 工作经历\n### 某家电企业｜采购工程师｜2021.02-至今\n- 主导关键物料议价，年度采购成本降低 11%\n- 搭建供应商绩效体系，交付准时率提升至 97%\n\n## 项目经历\n### 新品导入采购保障\n- 协同研发与生产，保障新品按期量产\n\n## 教育背景\n- XX大学 工商管理 本科`,
  },
  {
    id: "t12",
    industry: "医疗健康",
    role: "临床协调员",
    level: "1-3年",
    title: "医疗健康｜临床协调员｜CRC",
    md: `# 冯四\n\n## 求职意向\n- 临床协调员（CRC）\n\n## 个人优势\n- 2年临床试验项目支持经验，熟悉GCP规范\n\n## 工作经历\n### 某三甲医院研究中心｜CRC｜2023.03-至今\n- 协调多中心项目执行，受试者入组达成率 105%\n- 优化访视流程，数据录入及时率提升 18%\n\n## 项目经历\n### 肿瘤药物III期试验支持\n- 负责受试者管理与文档维护，稽查通过率 100%\n\n## 教育背景\n- XX医科大学 护理学 本科`,
  },
  {
    id: "t13",
    industry: "医疗健康",
    role: "医学信息沟通专员",
    level: "1-3年",
    title: "医疗健康｜医药代表｜处方药",
    md: `# 冯五\n\n## 求职意向\n- 医学信息沟通专员\n\n## 个人优势\n- 3年处方药学术推广经验，擅长医院渠道维护\n\n## 工作经历\n### 某外资药企｜MIS专员｜2022.01-至今\n- 覆盖重点医院 60+，目标产品市场份额提升 6pct\n- 策划区域学术活动，医生参与率提升 30%\n\n## 项目经历\n### 新适应症上市推广\n- 组织学术会议与科室宣教，提升产品认知度\n\n## 教育背景\n- XX大学 药学 本科`,
  },
  {
    id: "t14",
    industry: "医疗健康",
    role: "医疗器械注册专员",
    level: "3-5年",
    title: "医疗健康｜器械注册专员｜法规",
    md: `# 冯六\n\n## 求职意向\n- 医疗器械注册专员\n\n## 个人优势\n- 4年器械注册与法规合规经验，熟悉NMPA申报流程\n\n## 工作经历\n### 某器械公司｜注册专员｜2021.06-至今\n- 完成 II/III 类产品注册 9 项，申报一次通过率 89%\n- 建立法规更新机制，显著降低补件风险\n\n## 项目经历\n### 核心产品注册提速项目\n- 协调研发与测试，注册周期缩短 20%\n\n## 教育背景\n- XX大学 生物医学工程 本科`,
  },
  {
    id: "t15",
    industry: "教育",
    role: "课程产品经理",
    level: "3-5年",
    title: "教育｜课程产品经理｜K12",
    md: `# 陈七\n\n## 求职意向\n- 课程产品经理\n\n## 个人优势\n- 4年教培产品经验，擅长课程体系与学习路径设计\n\n## 工作经历\n### 某在线教育平台｜课程产品经理｜2021.09-至今\n- 主导课程改版，完课率提升 14%\n- 建立学习行为分析模型，续费率提升 10%\n\n## 项目经历\n### AI伴学产品上线\n- 联动教研与技术团队，2个月完成MVP并快速迭代\n\n## 教育背景\n- XX师范大学 教育技术学 本科`,
  },
  {
    id: "t16",
    industry: "教育",
    role: "教研老师",
    level: "1-3年",
    title: "教育｜教研老师｜语文方向",
    md: `# 陈八\n\n## 求职意向\n- 教研老师（语文）\n\n## 个人优势\n- 3年教研与授课经验，熟悉中学语文教学体系\n\n## 工作经历\n### 某教育机构｜教研老师｜2022.02-至今\n- 输出课程讲义 120+ 份，学员满意度 96%\n- 优化题库结构，课堂达标率提升 11%\n\n## 项目经历\n### 中考冲刺课程研发\n- 设计分层教学方案，学员平均提分 12 分\n\n## 教育背景\n- XX大学 汉语言文学 本科`,
  },
  {
    id: "t17",
    industry: "教育",
    role: "班主任",
    level: "1-3年",
    title: "教育｜班主任｜升学服务",
    md: `# 陈九\n\n## 求职意向\n- 班主任（升学服务）\n\n## 个人优势\n- 2年学员服务与家校沟通经验，擅长过程管理\n\n## 工作经历\n### 某培训机构｜班主任｜2023.01-至今\n- 管理学员 180+，出勤率提升 15%\n- 建立周报机制，家长满意度提升 18%\n\n## 项目经历\n### 学习陪跑计划\n- 设计阶段目标与复盘流程，学员达标率提升 20%\n\n## 教育背景\n- XX大学 心理学 本科`,
  },
  {
    id: "t18",
    industry: "零售快消",
    role: "品牌经理",
    level: "5-8年",
    title: "零售快消｜品牌经理｜消费品",
    md: `# 刘十\n\n## 求职意向\n- 品牌经理\n\n## 个人优势\n- 6年快消品牌营销经验，擅长品牌策略与整合传播\n\n## 工作经历\n### 某快消品牌｜品牌经理｜2019.10-至今\n- 主导新品上市战役，首季销量超目标 28%\n- 优化媒介投放组合，ROI提升 24%\n\n## 项目经历\n### 年度品牌焕新项目\n- 完成品牌定位重塑，品牌好感度提升 13pct\n\n## 教育背景\n- XX大学 市场营销 本科`,
  },
  {
    id: "t19",
    industry: "零售快消",
    role: "门店运营经理",
    level: "3-5年",
    title: "零售快消｜门店运营经理｜连锁",
    md: `# 刘一\n\n## 求职意向\n- 门店运营经理\n\n## 个人优势\n- 5年连锁门店运营经验，擅长标准化运营与损耗控制\n\n## 工作经历\n### 某连锁品牌｜门店运营经理｜2021.01-至今\n- 管理门店 12 家，月均坪效提升 16%\n- 优化排班和动线，人工成本下降 9%\n\n## 项目经历\n### 门店数字化巡检\n- 推动SOP线上化，门店执行合规率提升至 95%\n\n## 教育背景\n- XX大学 工商管理 本科`,
  },
  {
    id: "t20",
    industry: "零售快消",
    role: "供应链计划专员",
    level: "1-3年",
    title: "零售快消｜供应链计划专员",
    md: `# 刘二\n\n## 求职意向\n- 供应链计划专员\n\n## 个人优势\n- 3年供应链计划经验，熟悉需求预测与库存周转管理\n\n## 工作经历\n### 某食品公司｜供应链计划专员｜2022.04-至今\n- 优化补货模型，缺货率下降 30%\n- 提升库存周转效率，周转天数下降 12 天\n\n## 项目经历\n### 大促备货专项\n- 协同销售与仓配，保障大促履约率 99%\n\n## 教育背景\n- XX大学 物流管理 本科`,
  },
  {
    id: "t21",
    industry: "新能源",
    role: "电池研发工程师",
    level: "3-5年",
    title: "新能源｜电池研发工程师",
    md: `# 马三\n\n## 求职意向\n- 电池研发工程师\n\n## 个人优势\n- 4年锂电材料与电芯开发经验，熟悉实验设计与失效分析\n\n## 工作经历\n### 某新能源企业｜电池研发工程师｜2021.03-至今\n- 优化配方体系，循环寿命提升 15%\n- 建立测试标准流程，实验重复性显著提升\n\n## 项目经历\n### 高倍率电芯开发\n- 推动样品迭代，满足客户性能指标并实现中试\n\n## 教育背景\n- XX大学 材料科学与工程 硕士`,
  },
  {
    id: "t22",
    industry: "新能源",
    role: "光伏项目经理",
    level: "5-8年",
    title: "新能源｜光伏项目经理",
    md: `# 马四\n\n## 求职意向\n- 光伏项目经理\n\n## 个人优势\n- 7年新能源项目管理经验，熟悉EPC全流程\n\n## 工作经历\n### 某能源集团｜光伏项目经理｜2019.02-至今\n- 管理分布式光伏项目 20+，并网成功率 100%\n- 优化施工计划，平均工期缩短 18%\n\n## 项目经历\n### 工商业屋顶光伏集群项目\n- 协调多方资源，年发电量达成率超预期\n\n## 教育背景\n- XX大学 电气工程及其自动化 本科`,
  },
  {
    id: "t23",
    industry: "新能源",
    role: "储能系统工程师",
    level: "3-5年",
    title: "新能源｜储能系统工程师",
    md: `# 马五\n\n## 求职意向\n- 储能系统工程师\n\n## 个人优势\n- 4年储能系统集成经验，熟悉BMS/EMS协同\n\n## 工作经历\n### 某储能科技公司｜系统工程师｜2021.07-至今\n- 主导工商业储能方案设计，项目毛利率提升 6pct\n- 建立调试标准流程，交付周期缩短 14%\n\n## 项目经历\n### 园区级储能改造项目\n- 完成峰谷套利策略验证，客户电费成本显著下降\n\n## 教育背景\n- XX大学 自动化 本科`,
  },
  {
    id: "t24",
    industry: "物流供应链",
    role: "物流运营经理",
    level: "5-8年",
    title: "物流供应链｜物流运营经理",
    md: `# 胡六\n\n## 求职意向\n- 物流运营经理\n\n## 个人优势\n- 6年仓配一体化运营经验，擅长成本优化与履约效率提升\n\n## 工作经历\n### 某电商物流公司｜物流运营经理｜2019.05-至今\n- 优化路由与波次策略，履约时效提升 20%\n- 年度运营成本下降 12%\n\n## 项目经历\n### 区域仓网优化项目\n- 推动仓网重构，干支线协同效率显著提升\n\n## 教育背景\n- XX大学 交通运输 本科`,
  },
  {
    id: "t25",
    industry: "物流供应链",
    role: "仓储主管",
    level: "3-5年",
    title: "物流供应链｜仓储主管",
    md: `# 胡七\n\n## 求职意向\n- 仓储主管\n\n## 个人优势\n- 4年仓储现场管理经验，熟悉WMS与库存控制\n\n## 工作经历\n### 某零售仓配中心｜仓储主管｜2021.11-至今\n- 管理仓内团队 40+，盘点差异率下降 45%\n- 优化拣选路径，日处理效率提升 27%\n\n## 项目经历\n### 仓库拣选模式升级\n- 从人工经验转向系统化波次，错发率显著下降\n\n## 教育背景\n- XX大学 物流工程 本科`,
  },
  {
    id: "t26",
    industry: "物流供应链",
    role: "跨境供应链专员",
    level: "1-3年",
    title: "物流供应链｜跨境供应链专员",
    md: `# 胡八\n\n## 求职意向\n- 跨境供应链专员\n\n## 个人优势\n- 2年跨境履约经验，熟悉清关流程与海外仓运营\n\n## 工作经历\n### 某跨境电商公司｜供应链专员｜2023.03-至今\n- 优化补货节奏，海外仓断货率下降 33%\n- 推动物流商考核机制，妥投时效提升 16%\n\n## 项目经历\n### 旺季备货保障项目\n- 通过销售预测与安全库存机制，旺季缺货可控\n\n## 教育背景\n- XX大学 国际经济与贸易 本科`,
  },
  {
    id: "t27",
    industry: "地产建筑",
    role: "土建工程师",
    level: "3-5年",
    title: "地产建筑｜土建工程师",
    md: `# 林九\n\n## 求职意向\n- 土建工程师\n\n## 个人优势\n- 5年土建施工管理经验，熟悉施工组织与质量安全管理\n\n## 工作经历\n### 某总包单位｜土建工程师｜2020.08-至今\n- 管理多个施工标段，节点达成率 98%\n- 优化工序衔接，返工率下降 22%\n\n## 项目经历\n### 商业综合体建设项目\n- 参与全周期施工管理，项目按期交付\n\n## 教育背景\n- XX大学 土木工程 本科`,
  },
  {
    id: "t28",
    industry: "地产建筑",
    role: "造价工程师",
    level: "3-5年",
    title: "地产建筑｜造价工程师",
    md: `# 林十\n\n## 求职意向\n- 造价工程师\n\n## 个人优势\n- 4年工程预结算经验，熟悉清单计价与成本管控\n\n## 工作经历\n### 某地产公司｜造价工程师｜2021.04-至今\n- 负责项目预结算审核，累计节约成本超 1200 万\n- 建立成本对标库，提升报价准确性\n\n## 项目经历\n### 住宅项目成本优化\n- 协同设计与采购，综合成本下降 7%\n\n## 教育背景\n- XX大学 工程管理 本科`,
  },
  {
    id: "t29",
    industry: "地产建筑",
    role: "项目招商主管",
    level: "5-8年",
    title: "地产建筑｜项目招商主管｜商业",
    md: `# 林一\n\n## 求职意向\n- 项目招商主管\n\n## 个人优势\n- 6年商业地产招商经验，擅长业态规划与商户谈判\n\n## 工作经历\n### 某商业地产集团｜招商主管｜2019.07-至今\n- 完成项目招商率 95%+，引入核心品牌 40+\n- 优化租户结构，项目出租收益提升 18%\n\n## 项目经历\n### 新开业商场招商项目\n- 主导业态组合方案，开业首年客流超预期\n\n## 教育背景\n- XX大学 市场营销 本科`,
  },
  {
    id: "t30",
    industry: "公共服务",
    role: "政务项目专员",
    level: "1-3年",
    title: "公共服务｜政务项目专员",
    md: `# 江二\n\n## 求职意向\n- 政务项目专员\n\n## 个人优势\n- 3年政务项目执行经验，熟悉项目申报与过程管理\n\n## 工作经历\n### 某政务服务机构｜项目专员｜2022.05-至今\n- 协调多个民生项目推进，节点达成率 96%\n- 建立材料模板库，申报效率提升 30%\n\n## 项目经历\n### 数字政务服务优化项目\n- 完成需求梳理与流程优化，群众满意度提升\n\n## 教育背景\n- XX大学 公共事业管理 本科`,
  },
];

const allIndustries = ["全部", ...Array.from(new Set(templates.map((t) => t.industry)))];

function buildEnhancedMd(template: Template) {
  return `${template.md}

## 核心技能
- 行业知识：熟悉${template.industry}常见业务流程与关键指标体系
- 专业能力：具备${template.role}岗位核心方法论与落地经验
- 协作沟通：可跨团队推进需求、排期、执行与复盘

## 专业证书
- 与岗位相关证书：[请补充具体证书]
- 行业培训经历：[请补充培训项目]

## 语言与工具
- 语言：中文（母语），英文（可用于工作沟通）
- 工具：Office/协作平台/数据分析工具（可按岗位补充）

## 自我评价
- 结果导向，具备目标拆解与执行闭环能力
- 学习能力强，能快速适应新业务并稳定交付
- 对${template.industry}行业保持持续关注，具备长期发展意愿`;
}

export default function TemplatesPage() {
  const [industry, setIndustry] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const enhancedTemplates = useMemo(
    () => templates.map((item) => ({ ...item, fullMd: buildEnhancedMd(item) })),
    []
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return enhancedTemplates.filter((item) => {
      const hitIndustry = industry === "全部" || item.industry === industry;
      const hitKeyword =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.level.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q) ||
        item.fullMd.toLowerCase().includes(q);
      return hitIndustry && hitKeyword;
    });
  }, [enhancedTemplates, industry, keyword]);

  const previewTemplate = useMemo(
    () => enhancedTemplates.find((item) => item.id === previewTemplateId) || null,
    [enhancedTemplates, previewTemplateId]
  );

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("已复制为 Markdown");
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">简历模板库</h1>
        <p className="text-muted-foreground mt-1">
          30 份不同行业简历模板，支持分类筛选、关键词搜索、点击卡片弹窗大预览并复制 Markdown
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            模板筛选
          </CardTitle>
          <CardDescription>按行业筛选并搜索岗位关键词</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {allIndustries.map((item) => (
              <Badge
                key={item}
                variant={industry === item ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => setIndustry(item)}
              >
                {item}
              </Badge>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索行业/岗位/年限关键词，例如：产品经理、金融、3-5年"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((tpl, idx) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.02 }}
          >
            <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setPreviewTemplateId(tpl.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{tpl.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {tpl.industry} · {tpl.role} · {tpl.level}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplateId(tpl.id);
                      }}
                    >
                      大预览
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(tpl.id, tpl.fullMd);
                      }}
                    >
                      {copiedId === tpl.id ? (
                        <><Check className="mr-1 h-3.5 w-3.5 text-green-600" />已复制</>
                      ) : (
                        <><Copy className="mr-1 h-3.5 w-3.5" />复制MD</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/40 p-3 max-h-52 overflow-auto">
                  {tpl.fullMd}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplateId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.title}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.industry} · {previewTemplate?.role} · {previewTemplate?.level}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/40 p-4 max-h-[65vh] overflow-auto">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap">
              {previewTemplate?.fullMd}
            </pre>
          </div>
          {previewTemplate && (
            <div className="flex justify-end">
              <Button onClick={() => handleCopy(previewTemplate.id, previewTemplate.fullMd)}>
                {copiedId === previewTemplate.id ? (
                  <><Check className="mr-1 h-3.5 w-3.5 text-green-600" />已复制</>
                ) : (
                  <><Copy className="mr-1 h-3.5 w-3.5" />复制该模板MD</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            没有匹配的模板，请尝试更换筛选条件或关键词。
          </CardContent>
        </Card>
      )}
    </div>
  );
}
