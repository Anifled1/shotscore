# ShotScore — 立项文档

**一句话**：免费、免注册、秒出的电商产品主图打分器。上传主图 → 0-100 总分 + 6 维度拆解 + 3 条具体修改建议 → 一键下载可分享的评分卡。

**实验编号**：#1 ｜ **立项日期**：2026-10-15 ｜ **开发预算**：7 天 ｜ **观察期**：上线后 14 天

## 为什么是它

1. 需求已验证：PickFu 把 Main Image Grader 做成了它付费生态的引流功能（6 维度、0-100）
2. 空档明确：**免费 + 免注册 + 秒出 + 可下载分享的评分卡**，目前没有独立工具占住这个位置
3. 传播机制原生：分数 + 评分卡是 Twitter 上最容易被转发的格式；卖家会自发晒分/吐槽
4. 避开红海：不做生成（Photoroom/Flair/Pebblely 挤满），做诊断
5. 零平台风险：用户上传图片，不抓取任何平台数据

## MVP 范围（In）

- 上传/拖拽一张主图（Amazon / TikTok Shop / 通用电商）
- Vision 模型按 rubric 打分，返回 JSON（总分 + 6 维度 + findings + 3 条 fixes）
- 结果页渲染 + **canvas 生成 1200×630 评分卡 PNG 下载**（带站点水印 = 免费传播位）
- Plausible 统计 + 邮箱收集（"解锁每天 10 次免费评分"换邮箱）
- 英文 UI，深色主题，移动端可用

## MVP 范围（Out，二期再说）

- 批量评分、竞品对比（这是付费功能的方向：$9/月）
- ASIN 自动拉图（引入平台风险，不做）
- 账号系统、AI 修复生成图

## 评分 Rubric（6 维度）

| 维度 | 权重 | 检查点示例 |
|------|-----|-----------|
| Subject fill 主体占比 | 0.20 | 产品是否占画面 85% 左右 |
| Visual impact 视觉冲击 | 0.25 | 缩略图下是否第一眼抓住 |
| Background 背景干净度 | 0.15 | 纯白/干扰元素/杂物 |
| Text clutter 文字干扰 | 0.10 | 主图上的文字/徽章/水印 |
| Compliance 平台合规 | 0.15 | Amazon 白底规则、无 logo/边框 |
| Mobile readability 移动端可读 | 0.15 | 手机缩略图尺寸下是否清晰 |

## 技术方案

- Next.js (App Router, TS) + Vercel，骨架已在 `projects/shot-score/` 跑通（`npm run dev`）
- `/api/grade`：接收 `{image: dataUrl}`。已接入 **DeepSeek `deepseek-flash`**（原生多模态，OpenAI 兼容；Pro 档不支持图片输入，别用错型号）。无 key 时自动降级为 mock，填 key 即生效。换供应商只改 `GRADE_BASE_URL`/`GRADE_MODEL`
- 评分卡：纯前端 canvas 绘制，无后端依赖
- 限流：先靠 Vercel 平台层，二期加 IP 限流

## 7 天计划

- D1（今天）：立项 ✅ + 骨架跑通 ✅
- D2：接 vision 模型 ✅（2026-10-15 完成：DeepSeek `deepseek-flash`，6 张真实样图实测，分数分布 20–68 且排序合理，findings 能读到图内具体品牌名/水印 ID；单次评分 5–8s）
- D3：结果页打磨 + 评分卡视觉 + Plausible/邮箱收集
- D4：部署上线 ✅ 域名已购：**getshotscore.com**（2026-10-17，阿里云）；代码水印/元数据已切换；待：DNS 指向 Vercel + 部署
- D5：准备发布资产：30s demo 视频、20 张"我给真实亚马逊主图打分"的评分卡素材
- D6：发 X 主推（数据型 thread：见下方推文草稿）+ 提交 Product Hunt
- D7：回复所有评论，收集反馈，决定 D8 起是迭代还是进入观察期

## 发布推文草稿（主推，数据型）

> I graded 100 real Amazon main images with AI.
> The median score: 41/100.
> The #1 thing the best 5% do differently: [找到数据里最反直觉的一条]
> Free tool, no signup: getshotscore.com

配套素材：5-8 张高分 vs 低分对比评分卡，一条 <30s 的 as-is 演示视频。

## 止损线（14 天观察期）

- < 1,000 访问 或 < 50 次评分 → 归档
- 无任何自发转发/讨论 → 归档
- **正向信号**：有人自发晒评分卡 / 卖家主动问批量功能 / PH 日进前 10 → 立即投入二期（批量评分 = 付费点）

## 复盘字段（归档时填）

死因（流量不够/留存不够/打分不准/没人愿意分享）/ 学到什么 / 哪些资产留下了（邮箱数、粉丝数、代码模板）
