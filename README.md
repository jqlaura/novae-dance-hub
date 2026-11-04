# Novae Dance Project

舞队用的小工具。

## 直拍对比 `fancam-compare/`

孩子用手机选“自己的练习视频”和“分配到的成员直拍”，网页按音乐自动对齐，生成一个左右（或上下）并排的对比视频，保存到手机。

- 在线版本（Claude Artifact，目前只有自己能打开）：https://claude.ai/artifact/VteLrSBvY2cCiXXc5VPPHC
- 全部在手机浏览器里处理，**视频不会上传到任何地方**，也没有服务器。
- 单个文件：[fancam-compare/index.html](fancam-compare/index.html)。放到任何静态网站（如 GitHub Pages）上就能用。

### 功能

- 自动对齐：两个视频用同一首歌、开始时间不同也能对上（误差约 1 帧以内）。
- 自动对错时：“换一个对齐点”在前 3 个候选之间切换；±1 帧 / ±0.1 秒手动微调。
- 练习视频镜像（照镜子练的翻过来）、左右 / 上下 / 互换、选用哪个视频的声音。
- 生成视频：边播边录（3 分钟视频要录 3 分钟），iPhone 上输出 mp4。

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
python3 tools/make_samples.py samples          # 重新生成两段假视频（可选；已经在 samples/ 里）
python3 -m http.server 8765 --bind 127.0.0.1 & # 起本地服务
node tests/run.js /tmp/out                     # 端到端：载入示例 → 对齐 → 导出 → 下载
node tests/preview.js                          # 预览时两边的时间差
cd /tmp/out && python3 <repo>/fancam-compare/tests/check.py   # 导出视频：左右帧差、声画差
```

`tests/demux.js` 要先准备 `tests/tmp/IMG_practice.MOV`、`tests/tmp/fancam_moov_end.mp4`：

```bash
mkdir -p tests/tmp
ffmpeg -i samples/practice.mp4 -c copy -f mov tests/tmp/IMG_practice.MOV
ffmpeg -i samples/fancam.mp4 -c copy tests/tmp/fancam_moov_end.mp4
```

需要 Node + Playwright（Chromium）、Python 3 + numpy + Pillow、ffmpeg。示例视频里的假“歌”：120 BPM，练习视频 1.5 秒后才开始放歌，直拍从歌的第 4 秒开始，所以正确答案是相差 5.5 秒。
