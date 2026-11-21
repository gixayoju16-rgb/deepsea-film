# 深海两千米 · 云端渲染

Remotion 工程，在 GitHub Actions 上渲染成片（4 核 Ubuntu，CPU 渲染）。

## 怎么出片
1. 打开仓库的 **Actions** 页 → 左侧 `render-film` → 右侧 **Run workflow**
2. 等 8–15 分钟
3. 在本次运行页面底部 **Artifacts** 下载 `deepsea-film`（里面是 film.mp4）

## 测试模式
Run workflow 时在 `frames` 填 `120`，只渲前 120 帧（约 1 分钟），用来验证改动。

## 本地跑（可选）
```bash
npm install
npx remotion studio src/index.ts
```

## 结构
- `src/DeepSea.tsx` — 8 个镜头 + 景深粒子 + 调色
- `public/voice/narration.m4a` — 云希旁白（本地生成）
- `public/subs.ass` — 字幕
- `.github/workflows/render.yml` — 渲染 + 混音 + 烧字幕
