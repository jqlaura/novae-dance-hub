# 交接：直拍对比（fancam-compare）— 2026-11-04（第 2 次）

先读 `CLAUDE.md`、`README.md`、`fancams.md`。用户用中文沟通，网页本身是**英文**。

## 现在的状态（全部接好了，只差真 iPhone 测试）

- **已上线**：https://jqlaura.github.io/novae-dance-hub/ （仓库 jqlaura/novae-dance-hub，公开，GitHub Pages 用 main 根目录）。
- **成员直拍**：NEON 9 人都在用户 Drive 的 `Fancams` 文件夹（知道链接可查看，文件夹 ID `1XNA2zVRygRC3pUL5foHW4XuBdQIofNI8`），`assignments.json` 里是 `drive:<ID>`。原压缩文件在用户 Mac `~/Downloads/neon-720/`。
- **API 密钥**：`driveApiKey`，只允许 `https://jqlaura.github.io/*` + Drive API（没有这个网站来源的请求会被 403）。用它可以列出 Fancams 文件夹：`files?q='<文件夹ID>' in parents`，记得带 `Referer: https://jqlaura.github.io/novae-dance-hub/`。
- **提交**：`submitUrl` 是用户部署的 Apps Script（`Novae Dance Hub — Submit`）。打开网页、做视频不要口令；**点 Submit 要填队伍口令**（用户定的，只在用户的 Apps Script 里，不写进仓库/记忆）。2026-11-04 线上实测：单块 5 MB 和 3 块 17 MB 都成功（每 8 MB 一块约 20–25 秒）。测试文件名是 “TEST … delete me”，在 `Fancam Submissions/Demo — sample videos/`，让用户删掉。
- 用户考虑过“进门口令”和“完全不要口令”，最后定的是**只在交作业时要口令**。

## 接下来

1. 请用户用**真 iPhone** 完整测一遍：打开网址 → NEON → 上传真的练习视频 → 镜像 → 选成员（从 Drive 读，约 47 MB）→ 开始时间 → 生成（实时录制）→ 下载 → Submit → 去 Drive 确认。重点看：iPhone 上读声音、预览卡不卡、导出视频声画对不对、75 MB 上传要多久。
2. 这台 Mac 的 Xcode 坏了（`xcrun simctl` 报 libxcodebuildLoader 错），模拟器用不了，要用户重装/打开一次 Xcode。
3. 加新歌：直拍压成 720×1280（命令见 CLAUDE.md），传到 Drive 新文件夹（知道链接可查看），用 API 密钥列出 ID，填进 `assignments.json` 新的一项。

## 注意

- 直接 commit + push 到 `main`，不开分支、不开 PR。
- 不把真实的孩子视频、压好的直拍放进仓库。`*.raw`（`tests/check.py` 生成的临时文件）已在 .gitignore。
- 本机的 `node` 是 v10（anaconda），测试要用 `/usr/local/bin/node`（v18）+ `playwright-core@1.49`（channel: 'chrome'）。
