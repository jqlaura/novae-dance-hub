# 交接：直拍对比（fancam-compare）— 2026-11-04

先读 `CLAUDE.md`、`README.md`、`fancams.md`，再读这里。用户用中文沟通，网页本身是**英文**。

## 现在的状态

- `fancam-compare/index.html`（第 2 版）：手机网页，6 步流程。① 选作业 → ② 上传自己的练习视频（可拖动、缩放，有居中线）→ ③ 问是否镜像，不是就自动镜像并告知 → ④ 选成员 → ⑤ 选开始时间 → ⑥ 预览、调整、生成对比视频 → Download / Submit。
- 作业和成员视频在 `fancam-compare/assignments.json`。成员视频 `mirror: true` = 显示时左右翻转，页面写着“All member videos are already mirrored”。A2O LITE — NEON 的 9 个成员 `video` 还是 `null`；“Demo — sample videos”作业用的是假视频，可以走完全程。
- 在线预览（Claude Artifact，只有用户自己能打开）：https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC 。Artifact 不能连外部网站，**正式版要搬到 GitHub Pages**。
- 测试：`python3 -m http.server 8765` 后 `node fancam-compare/tests/flow.js /tmp/out 8765`（端到端，正确答案：Member B 偏移 −3.5 秒）。
- **用户还没在 iPhone 上测过第 2 版。** 第 1 版在 iPhone 上修过“声音读不出来”和“预览卡顿、没声音”，修完也没再测。

## 用户已经定的事

- 网页放 **GitHub Pages**，免费。仓库可以公开（只有代码，没有视频和密码）。**不用 Netlify**，用户的 delibble 在 Netlify 上，不要动它。
- **全部免费**，不想花钱。
- 只在队里的孩子之间分享。**孩子提交的视频只有教练（用户）能看**，外人找到链接也看不到。
- 提交只存**最终的对比视频**，存到用户的 **Google Drive**。
- 直拍只要**竖版、全身、整首歌**的。不要横版，也不要建议把横版裁成竖版。
- **不要替用户从 YouTube 下载视频**（版权，违反 YouTube 条款）。9 个直拍用户自己已经有了，在 Mac 的 `~/Downloads`。

## 接下来要做（按顺序）

### 1. 重新设计外观（用户：“现在实在有点丑”）

用户想要 Gen Z（2010 年后出生的孩子）觉得好看的风格，可以简单。建议先做 2–3 个方向的截图给用户挑，再定稿。可以考虑的方向：
- 跟歌名 NEON 呼应：深色底、霓虹色描边和发光效果、粗圆的标题字（比如 Google Fonts 的 Unbounded、Bricolage Grotesque、Space Grotesk 这类），按钮做成胶囊形。
- 贴纸 / Y2K 风：浅色底、高饱和撞色、厚描边的卡片、带一点倾斜的贴纸标签。

注意：手机竖屏优先，字和按钮要大，深色、浅色模式都要好看，不要用紫蓝渐变那种“AI 模板感”。改完要同时更新 Artifact 预览（`python3 fancam-compare/tools/build_artifact.py fancam-compare/index.html OUT.html`，把生成的片段发布到上面那个 URL，文件一起带上 `assignments.json` 和 `samples/*.mp4`）。

### 2. 压缩 9 个直拍（本地会话可以直接做）

文件在用户 Mac 的 `~/Downloads`（4K，很大）。压成 720×1280、H.264 + AAC、`+faststart`，每个大约 30–50 MB：

```bash
brew install ffmpeg   # 如果还没有
mkdir -p ~/Downloads/neon-720
for f in ~/Downloads/*.mp4; do
  ffmpeg -i "$f" -vf "scale=720:-2" -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k -movflags +faststart "$HOME/Downloads/neon-720/$(basename "$f")"
done
```

先看清楚 Downloads 里哪 9 个文件是直拍，再跑。按成员名改文件名（Young、Himeki、Vora、Xili、Rada、Merci、Ayune、Oa、Aijing），对照 `fancams.md`。**压好的文件不要放进仓库**（公开仓库 + 版权）。

### 3. Google Drive：放直拍 + 收提交

- 两个文件夹：`NEON fancams`（设成“知道链接的人可以查看”，网页要读）和 `Submissions`（私人，只有用户能看）。
- **读直拍**：浏览器直接读 Drive 的下载链接会被拦（CORS）。用 Drive API v3 `https://www.googleapis.com/drive/v3/files/<FILE_ID>?alt=media&key=<API_KEY>`。用户要在 Google Cloud Console 建一个免费的 API 密钥，只开 Drive API，并限制只能从 GitHub Pages 的网址使用。把每个成员的地址填进 `assignments.json`。
- **收提交**：Google Apps Script 网页应用，“以我的身份运行，任何人都可以访问”，`doPost` 收分块上传（每块 ≤ 约 10 MB，base64），用 Drive 的可续传上传拼成一个文件，存进 `Submissions/<作业>/`，文件名带孩子名字和时间。服务端检查**队伍口令**（口令存在 Script Properties 里，不写进网页）。网页上 Submit 前要填名字和口令，显示上传进度。
- 视频太大的话，导出码率可以从 5 Mbps 降到约 2.5 Mbps（`startExport` 里的 `videoBitsPerSecond`）。
- 给用户写一步一步的中文说明：建文件夹、粘贴 Apps Script、发布、建 API 密钥。用户不是程序员。

### 4. 上线

- 仓库改公开前，再检查一遍有没有私人内容。用户已经同意公开。
- 开 GitHub Pages，然后在 iPhone 上完整测一遍：选作业 → 上传真的练习视频 → 镜像 → 选成员 → 开始时间 → 生成 → 下载 → 提交，再去 Drive 确认收到。

## 注意

- 直接 commit + push 到 `main`，不开分支、不开 PR。
- 不把真实的孩子视频放进仓库。
- 用户有 9 个成员直拍的 YouTube 链接，在 `fancams.md`（M2 MPD직캠，M Countdown 2026.10.22，竖版 4K，3:56）。
