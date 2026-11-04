# Novae Dance Project

舞队用的小工具。

## 直拍对比 `fancam-compare/`

孩子在手机上打开网页（英文界面，Novae logo 配色 + 夜空流星头图），按 6 步做出“自己的练习视频 + 分配成员的直拍”左右对比视频，音乐自动对齐。

- 在线版本（Claude Artifact，目前只有自己能打开）：https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC
- 页面：[fancam-compare/index.html](fancam-compare/index.html)；作业和成员视频列表：[fancam-compare/assignments.json](fancam-compare/assignments.json)
- 处理都在手机浏览器里完成；视频只有在“Submit”时才会上传（上传还没接好）。

### 孩子的流程

1. **Choose your assignment**：下拉选作业。页面强调“All member videos are already mirrored”。
2. **Upload your practice video**：选视频后可以拖动、缩放，有居中辅助线。
3. **Check if your video is mirrored**：选 No 就自动镜像，并提示“we mirrored your video”。
4. **Pick your member**：成员视频从 `assignments.json` 里的地址加载（`mirror: true` = 显示时左右翻转，所以放原版直拍就行）。
5. **Pick a start time**：按成员视频的时间选开始点，带缩略图预览。
6. **Preview, then create your video**：预览、调整（换对齐点、逐帧微调、镜像开关、左右/上下/互换、用谁的声音），生成后 **Download video** 或 **Submit**。

### 加一个作业 / 成员视频

在 `assignments.json` 里加一项：`{ "id", "title", "members": [{ "name", "video": "地址", "mirror": true }] }`。`video` 为 `null` 的成员显示“video not added yet”。`demo: true` 的作业会显示“Use a sample practice video”。

### 原理

1. **读声音**：自己解析 MP4/MOV，把 AAC 音轨拆出来包成 ADTS 再交给浏览器解码（iPhone Safari 直接解码 .MOV 经常失败）。不行再退回整体解码。会跳过 iPhone 的空间音频音轨。
2. **对齐**：两段声音降到 24 kHz 单声道，算每 10 ms 的“鼓点强度”（spectral flux），去掉慢变化（观众尖叫起伏），再用 FFT 互相关找时间差，抛物线插值到亚帧精度。
3. **预览**：用有声音的那个视频当主时钟（iPhone 静音键开着也有声），另一个视频靠微调播放速度跟随，尽量不跳转（跳转会卡）。
4. **导出**：canvas 画两个画面 + MediaRecorder 录制；声音用解码好的音频按 AudioContext 时钟播放。录制环节画面比声音晚约 0.1 秒，所以录制时让视频提前 0.1 秒。

### 已知限制

- 只在电脑 Chrome（Playwright）里自动测过，iPhone 上靠人工试。
- 直拍被调过速、中间剪过，对不上。
- 声音不是 AAC（例如有些 YouTube 下载的是 Opus）时，iPhone 上可能读不出来；提示里会显示原因。
- 两个 4K 视频同时播，旧手机可能卡。

### 测试

```bash
cd fancam-compare
python3 tools/make_samples.py samples          # 重新生成示例视频（可选；已经在 samples/ 里）
python3 -m http.server 8765 --bind 127.0.0.1 & # 起本地服务
node tests/flow.js /tmp/out 8765               # 端到端：作业 → 示例练习视频 → 镜像 → Member B → 从 0:03 开始 → 生成 → 下载
python3 tests/check.py /tmp/out/<下载的文件>.mp4   # 导出视频：左右帧差、声画差
python3 tools/build_artifact.py index.html /tmp/artifact/index.html   # 生成 Artifact 用的片段
```

`tests/demux.js` 比较“自己拆音轨”和“浏览器整体解码”的时间差，要先准备 `tests/tmp/IMG_practice.MOV`、`tests/tmp/fancam_moov_end.mp4`（用 ffmpeg `-c copy` 从示例转出来）。

需要 Node + Playwright（Chromium）、Python 3 + numpy + Pillow、ffmpeg。示例的正确答案：练习视频对 Member A / B / C 分别差 −5.5 / −3.5 / −0.5 秒。
