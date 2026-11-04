# 交接：直拍对比（fancam-compare）— 2026-11-04（第 2 次）

先读 `CLAUDE.md`、`README.md`、`fancams.md`。用户用中文沟通，网页本身是**英文**。

## 现在的状态

- **已上线**：https://jqlaura.github.io/novae-dance-project/ （GitHub Pages，main 分支根目录，自动跳到 `fancam-compare/`）。仓库已公开（上线前查过：没有孩子视频、口令、密钥；历史里的视频都是合成的）。
- **外观**定稿 S2：Novae logo 配色 + 夜空流星头图 + 系统字体，步骤标题是指令（见 CLAUDE.md）。
- **Drive 提交 / 读直拍的代码做好了**，用本地假服务测过（分块上传、重试、口令错误、拼好的文件逐字节一致）。真的 Apps Script 还没测。
- **9 个直拍**压好在用户 Mac 的 `~/Downloads/neon-720/NEON_<成员>.mp4`（720×1280，每个约 47 MB）。
- Claude Artifact 预览不再更新（以 GitHub Pages 为准）。

## 等用户做（说明：`fancam-compare/SETUP-GOOGLE-DRIVE.md`）

A. 把 `neon-720` 里 9 个视频传到 Drive `Fancams` 文件夹（知道链接可查看），发回 9 个链接。
B. Google Cloud 建 API 密钥（只开 Drive API，只允许 `https://jqlaura.github.io/*`），发回密钥。
C. Apps Script 粘贴 `apps-script/Code.gs`，改 `TEAM_CODE`，运行 `setup`，部署网页应用（我 / 任何人），发回 `/exec` 网址。

## 收到以后要做

1. 填进 `fancam-compare/assignments.json`：`driveApiKey`、`submitUrl`，9 个成员的 `video` 直接贴 Drive 分享链接。commit + push。
2. 在线上网页测：选 NEON → 选成员（看能不能从 Drive 读出来、音乐能不能读）→ 用示例练习视频对齐 → 生成 → Submit（口令错一次、对一次）→ 让用户去 Drive `Fancam Submissions/` 确认收到。
3. 请用户用**真 iPhone** 完整测一遍：上传真的练习视频 → 镜像 → 选成员 → 开始时间 → 生成 → 下载 → 提交。第 1 版修过的“声音读不出来”“预览卡顿没声音”第 2 版还没在 iPhone 上验证过。
4. 这台 Mac 的 Xcode 加载失败（`xcrun simctl` 报 libxcodebuildLoader 错），iPhone 模拟器用不了，要用户重装/打开一次 Xcode。

## 注意

- 直接 commit + push 到 `main`，不开分支、不开 PR。
- 不把真实的孩子视频、压好的直拍放进仓库。`*.raw`（`tests/check.py` 生成的临时文件）已在 .gitignore。
- 本机的 `node` 是 v10（anaconda），测试要用 `/usr/local/bin/node`（v18）+ `playwright-core@1.49`（channel: 'chrome'）。
