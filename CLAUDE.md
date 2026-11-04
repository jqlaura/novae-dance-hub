# CLAUDE.md — Novae Dance Project

用户带一个小孩舞队。这个仓库放给舞队用的小工具。用户用中文沟通，回复用简单直白的中文。

## 直拍对比（fancam-compare/）

- 需求（用户 2026-11-04）：孩子把自己的练习视频和分配到的成员直拍上传，自动按音乐对齐，生成左右对比视频。手机端，越简单越好。
- 决定：全部在手机浏览器里处理，视频不上传、不存 GitHub（未成年人隐私；GitHub 单文件 100 MB 限制）。
- 在线版本是 Claude Artifact：https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC （声明了 `downloads` 能力，用来“保存到手机”）。Artifact 版本是 `index.html` 去掉 `<!doctype>…<body>` 外壳的片段；改完要同时更新 repo 和 Artifact。
- 用户 iPhone 实测（2026-11-04）：① “声音读不出来” → 改成自己拆 MOV/MP4 的 AAC 音轨；② 预览卡顿、没声音 → 预览改用主视频自带声音（静音键不影响），另一个视频只微调速度跟随。改完待用户再测。
- 待定：是否分享给孩子们（Artifact 公开链接，或 GitHub Pages；仓库是私有的，Pages 需要付费账号或改公开）。
- 测试方法见 README。合成示例的正确答案：相差 5.5 秒。

## 规则

- 直接 commit + push 到 `main`，不开分支、不开 PR（和用户其他仓库一致）。
- 不把真实的孩子视频放进仓库。
