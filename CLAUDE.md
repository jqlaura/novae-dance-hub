# CLAUDE.md — Novae Dance Hub

> **接手先读 `HANDOFF.md`**（2026-11-04：外观、压缩、Drive、提交、上线全部接好；只差用户用真 iPhone 测）。

用户带一个小孩舞队。这个仓库放给舞队用的小工具。用户用中文沟通，回复用简单直白的中文。

## 直拍对比（fancam-compare/）

- 需求（用户 2026-11-04）：孩子把自己的练习视频和分配到的成员直拍上传，自动按音乐对齐，生成左右对比视频。手机端，越简单越好。
- 第 2 版（用户 2026-11-04）：**整个网页英文**。成员视频预先放进 app（`assignments.json`），显示时镜像，页面强调已镜像。孩子流程：选作业 → 上传自己的视频（可拖动/缩放，有居中线）→ 问是否镜像，不是就自动镜像并告知 → 选成员 → 选开始时间 → 生成对比视频 → Download / Submit。保留所有调整功能。
- 外观（用户 2026-11-04 定稿 S2）：Novae logo 配色（粉 #f08cc8 → 淡紫 #b49cf2 → 天蓝 #7cc4ff，颜色是从小图估的，有原图再校准），只用手机自带字体，顶部是深色“夜空”卡片 + 渐变流星（SVG）。顶部小字 “EDS Junior · NOVAE”。用户不要：太多颜色和字体、贴纸/可爱风、放射线。步骤标题用直接的指令，不用问句。不要绑定某一首歌（NEON 只是其中一个作业）。
- Artifact 片段用 `python3 fancam-compare/tools/build_artifact.py index.html OUT` 生成（取 `artifact:*` 标记之间的内容）。
- 决定：全部在手机浏览器里处理，视频不上传、不存 GitHub（未成年人隐私；GitHub 单文件 100 MB 限制）。
- **正式网址（GitHub Pages，2026-11-04 上线）**：https://jqlaura.github.io/novae-dance-hub/ （根目录 `index.html` 跳到 `fancam-compare/`）。push 到 main 一两分钟后自动更新。 仓库 2026-11-04 从 novae-dance-project 改名为 **jqlaura/novae-dance-hub**（项目名 Novae Dance Hub）；本地文件夹名没改。
- 旧的 Claude Artifact 预览（https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC）不再更新。
- 用户 iPhone 实测（2026-11-04）：① “声音读不出来” → 改成自己拆 MOV/MP4 的 AAC 音轨；② 预览卡顿、没声音 → 预览改用主视频自带声音（静音键不影响），另一个视频只微调速度跟随。改完待用户再测。
- 已定（用户 2026-11-04）：提交存用户的 **Google Drive**（私人文件夹，只有教练能看），网页放 **GitHub Pages**（仓库可以公开），全部免费，不用 Netlify（用户的 delibble 在 Netlify，别动）。细节见 HANDOFF.md。
- 9 个成员直拍（原文件 `~/Downloads/NEON_FanCam_<成员>.mp4`，1440×2560）压成 720×1280 放在 `~/Downloads/neon-720/NEON_<成员>.mp4`（libx264 medium，crf 25 + maxrate 1600k，声音直接复制，每个约 50 MB；不限码率时 crf 23 会超过 100 MB）。由用户传到 Drive。不放进公开仓库（M2 的版权视频）。
- Drive（2026-11-04 已接好，见 HANDOFF）：`assignments.json` 的 `video` 可以直接贴 Drive 分享链接，网页经 Drive API + `driveApiKey` 读取；`submitUrl` 是 Apps Script 网页应用（`apps-script/Code.gs`，口令 `TEAM_CODE` 只写在脚本里），按 8 MB 分块 base64 上传，脚本用 Drive 可续传上传拼成文件，存 `Fancam Submissions/<作业>/`。用户的设置步骤：`fancam-compare/SETUP-GOOGLE-DRIVE.md`。本地测提交可以用假的脚本服务（协议：`start` → `{id, chunk}`，`chunk` → `{done, next}`）。
- 成员直拍清单见 `fancams.md`（A2O LITE NEON 9 人，MPD직캠 10.22 竖版 4K，已核实）。舞队要的是**竖版、全身、整首**的直拍；横版不要。
- 云端环境的网络要允许 `www.youtube.com`、`youtu.be` 才能查视频标题和尺寸（2026-11-04 用户已放开）。查尺寸：抓 watch 页面里 `ytInitialPlayerResponse` 的 `adaptiveFormats` 宽高；查标题：oEmbed。
- 开始时间（第 5 步，用户 2026-11-04 强调：作业常常只是歌的中间一段）：对齐后滑块自动放到孩子视频在成员直拍里的位置；孩子自己挪开始时间，就只在“包含这个时间”的范围里重新对一次音乐（副歌重复时防止对错）；孩子手动点过 Try another / 微调就不覆盖。重新对的结果必须不弱于全局最好匹配的 60%，否则保持原匹配（a90c799 没有这个保护：孩子把开始时间放到 0:05 时，中段片段会被强行对到 5.46 秒，完全对不上；用户 2026-11-04 实测“完全没对齐”）。状态栏写明“Your video at X = 成员 video at Y”，方便排查。真直拍测试：Himeki 1:35 起 40 秒对 Young → 95.0 秒。
- **iPhone 播放从 0:00 开始的 bug（用户 2026-11-04 实测，电脑上正常、手机上不行）**：iPhone Safari 视频没播放过之前，跳时间（currentTime = …）会被丢掉或推迟，所以按 ▶ 后两个视频都从头放。修法：`lineUp()`：先静音播放把视频“激活”，暂停，**每次都重新跳**（Safari 会把早先的跳转推迟执行，把视频拉回 0:00），等 `seeked` 并核对位置，再开始播放；导出同样先 `lineUp(0)`。`follow()` 跳转卡住 1.5 秒会重试，跳转时提前量按实测跳转耗时。测试：`ios_run.js` 用脚本模拟“没播放过就丢掉跳转”（旧版重现 −4.84 秒错位，新版正确）；Playwright WebKit 已装（~/Library/Caches/ms-playwright），可以测 Safari 内核。**电脑上测通过不算数，必须用户手机确认。**
- 用户的真实测试视频：`~/Downloads/Karina-Aijing Intro 2.MOV`（iPhone HEVC 60fps 1080×1920，声音很小），对 Aijing：你的 0:04.84 = Aijing 0:00。不要放进仓库。
- **第 3 版流程（用户 2026-11-04 定）**：名字 Novae Dance Hub；没有选作业（`defaultAssignment` = NEON，选择框藏起来，测试还能用）；孩子的视频**一律镜像**，上传步骤里有一行说明（不再问是否镜像）；步骤：1 上传 → 2 选成员 → 3 开始时间 → 4 Generate comparison video。**没有实时预览/Adjust/Try another**（手机上同时播两个视频会卡、会对不齐，用户明确不要）。生成后只有：看视频、Download、“Are you happy with this homework? Is this your final submission?” → “Yes, I'm doing my best!”（出现名字+口令+Submit）/ “No, I'll practice more and resubmit”（删掉视频，回到第 1 步，鼓励的话）。目的是让孩子认真看对比视频找问题。
- **生成方式：逐帧合成**（`exportExact`）：WebCodecs 解码两边每一帧（iPhone 10-bit HDR HEVC 在 Safari 内核里解不了时，自动改用 `<video>` 逐帧跳转 `ElementSource`），按准确时间画到 canvas，VideoEncoder 编 H.264，成员的 AAC 音轨原样拷进自己写的 MP4（`writeMP4`）。从成员的一个 AAC 帧开始，画面跟着挪，声音精确到采样。没有 VideoEncoder 的浏览器才用旧的录屏方式。用户的 Aijing 视频验证：Chrome 和 WebKit 输出里孩子画面、成员画面、音乐误差都在 1 帧以内（`check_sync.sh` 用动作能量互相关测）。
- **每周文件夹**：提交存 `Fancam Submissions/HW<n>/`，周日开始新的一周，`weeks.firstSunday` = 2026-10-25 是 HW1（10/25–10/31），11/1–11/7 是 HW2。周数在网页里按孩子手机的日期算，作为 `assignment` 传给 Apps Script（脚本不用改）。
- 测试方法见 README。合成示例的正确答案：相差 5.5 秒。

## 规则

- 直接 commit + push 到 `main`，不开分支、不开 PR（和用户其他仓库一致）。
- 不把真实的孩子视频放进仓库。
