# CLAUDE.md — Novae Dance Project

> **接手先读 `HANDOFF.md`**（2026-11-04：外观、压缩、Drive 代码、上线都做完了；等用户设置 Google Drive，再填链接、在 iPhone 上测）。

用户带一个小孩舞队。这个仓库放给舞队用的小工具。用户用中文沟通，回复用简单直白的中文。

## 直拍对比（fancam-compare/）

- 需求（用户 2026-11-04）：孩子把自己的练习视频和分配到的成员直拍上传，自动按音乐对齐，生成左右对比视频。手机端，越简单越好。
- 第 2 版（用户 2026-11-04）：**整个网页英文**。成员视频预先放进 app（`assignments.json`），显示时镜像，页面强调已镜像。孩子流程：选作业 → 上传自己的视频（可拖动/缩放，有居中线）→ 问是否镜像，不是就自动镜像并告知 → 选成员 → 选开始时间 → 生成对比视频 → Download / Submit。保留所有调整功能。
- 外观（用户 2026-11-04 定稿 S2）：Novae logo 配色（粉 #f08cc8 → 淡紫 #b49cf2 → 天蓝 #7cc4ff，颜色是从小图估的，有原图再校准），只用手机自带字体，顶部是深色“夜空”卡片 + 渐变流星（SVG）。顶部小字 “EDS Junior · NOVAE”。用户不要：太多颜色和字体、贴纸/可爱风、放射线。步骤标题用直接的指令，不用问句。不要绑定某一首歌（NEON 只是其中一个作业）。
- Artifact 片段用 `python3 fancam-compare/tools/build_artifact.py index.html OUT` 生成（取 `artifact:*` 标记之间的内容）。
- 决定：全部在手机浏览器里处理，视频不上传、不存 GitHub（未成年人隐私；GitHub 单文件 100 MB 限制）。
- **正式网址（GitHub Pages，2026-11-04 上线）**：https://jqlaura.github.io/novae-dance-project/ （根目录 `index.html` 跳到 `fancam-compare/`）。push 到 main 一两分钟后自动更新。
- 旧的 Claude Artifact 预览（https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC）不再更新。
- 用户 iPhone 实测（2026-11-04）：① “声音读不出来” → 改成自己拆 MOV/MP4 的 AAC 音轨；② 预览卡顿、没声音 → 预览改用主视频自带声音（静音键不影响），另一个视频只微调速度跟随。改完待用户再测。
- 已定（用户 2026-11-04）：提交存用户的 **Google Drive**（私人文件夹，只有教练能看），网页放 **GitHub Pages**（仓库可以公开），全部免费，不用 Netlify（用户的 delibble 在 Netlify，别动）。细节见 HANDOFF.md。
- 9 个成员直拍（原文件 `~/Downloads/NEON_FanCam_<成员>.mp4`，1440×2560）压成 720×1280 放在 `~/Downloads/neon-720/NEON_<成员>.mp4`（libx264 medium，crf 25 + maxrate 1600k，声音直接复制，每个约 50 MB；不限码率时 crf 23 会超过 100 MB）。由用户传到 Drive。不放进公开仓库（M2 的版权视频）。
- Drive（2026-11-04 做好代码，等用户设置）：`assignments.json` 的 `video` 可以直接贴 Drive 分享链接，网页经 Drive API + `driveApiKey` 读取；`submitUrl` 是 Apps Script 网页应用（`apps-script/Code.gs`，口令 `TEAM_CODE` 只写在脚本里），按 8 MB 分块 base64 上传，脚本用 Drive 可续传上传拼成文件，存 `Fancam Submissions/<作业>/`。用户的设置步骤：`fancam-compare/SETUP-GOOGLE-DRIVE.md`。本地测提交可以用假的脚本服务（协议：`start` → `{id, chunk}`，`chunk` → `{done, next}`）。
- 成员直拍清单见 `fancams.md`（A2O LITE NEON 9 人，MPD직캠 10.22 竖版 4K，已核实）。舞队要的是**竖版、全身、整首**的直拍；横版不要。
- 云端环境的网络要允许 `www.youtube.com`、`youtu.be` 才能查视频标题和尺寸（2026-11-04 用户已放开）。查尺寸：抓 watch 页面里 `ytInitialPlayerResponse` 的 `adaptiveFormats` 宽高；查标题：oEmbed。
- 测试方法见 README。合成示例的正确答案：相差 5.5 秒。

## 规则

- 直接 commit + push 到 `main`，不开分支、不开 PR（和用户其他仓库一致）。
- 不把真实的孩子视频放进仓库。
