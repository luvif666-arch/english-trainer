# 外贸口语工作台

面向中国外贸从业者的英语口语自学工具。纯静态网页，数据全部存在浏览器本地，不上传任何服务器。

## 功能

- **影子跟读** — 导入音视频 + 字幕（SRT/VTT），逐句循环、变速 0.6×–1.2×、双击标记已掌握
- **自动字幕** — 浏览器端跑 Whisper（transformers.js + ONNX），音视频不出本机。首次下载模型后浏览器永久缓存
- **点词查词** — 点句子任意单词查释义（音标/词性/中文/例句），可朗读、可加入生词本
- **录音复述** — 浏览器直接录音 + 6 项自评清单
- **AI 陪练** — 生成角色扮演提示词（按目标市场调整谈判风格），复制到任意 AI 使用
- **话术库** — 7 组外贸场景话术，填一次产品/公司名自动全文替换
- **实景对话** — 3 个全流程模拟剧本（地推搭话/展位接待/报价异议），英式英语语音朗读
- **目标地区** — 6 个市场包（美式/英式/中东/拉美/东南亚/印度），联动口音、商务风格、AI 陪练规则
- **素材包** — 待跟读清单 + 生词本，标注每个源在当前网络下能不能下
- **素材下载器** — 双击 `运行下载器.bat` 打开本地网页版界面，把 B站链接变成 mp3 喂给影子跟读
- **8 周路径** — 每周目标 + 打卡

## 使用

直接双击 `index.html` 即可。推荐用 Chrome / Edge。

需要联网的功能：自动字幕（首次下模型）、点词查词、语音朗读。

## 素材下载器

把视频链接转成音频 + 字幕，供影子跟读使用。

### 1. 装依赖（两个 exe 不在仓库里，体积太大）

放在项目根目录：

| 文件 | 怎么拿 |
|---|---|
| `yt-dlp.exe` | `pip install -U yt-dlp` 后从 Scripts 目录复制 |
| `ffmpeg.exe` | `pip install imageio-ffmpeg` 后从包内 binaries 目录复制 |

### 2. 启动

双击 `运行下载器.bat`，浏览器自动打开 `http://127.0.0.1:8765`，粘贴链接点「开始下载」。

下好的文件在 `download/`，拖进「影子跟读」区即可。黑窗口关掉就等于关掉下载器。

**网络前提**：能否下取决于你的网络环境。B站一般可用；YouTube / BBC 在部分网络下不可达。详见 `下载器使用说明.md`。

**字幕**：B站/YouTube 的字幕需要登录态，未登录时常返回「无字幕」。此时用工作台内的「自动生成字幕」（浏览器端 Whisper）即可。

## 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "外贸口语工作台"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

然后在仓库 Settings → Pages 里，Source 选 `main` 分支 `/ (root)`。

## 数据

全部存在浏览器 localStorage。换设备前请用「8周路径 → 导出进度备份」下载 JSON。

## 第三方服务

- 中文翻译：[MyMemory](https://mymemory.translated.net)
- 语音识别：[transformers.js](https://github.com/huggingface/transformers.js) + OpenAI Whisper（Apache 2.0）
- 音频下载：[yt-dlp](https://github.com/yt-dlp/yt-dlp)（Unlicense）

释义以项目内置的外贸高频离线词典（`js/bizdict.js`，86 词）为主，未命中时走 MyMemory 联网翻译。
