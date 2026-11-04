# 设置 Google Drive（教练做一次就行）

一共四部分（A–C 是 Google，D 是 GitHub），全部免费。都用**同一个 Google 账号**做。

| 部分 | 做什么 | 做完给我什么 |
|---|---|---|
| A | 把成员直拍放进 Drive，网页从这里读 | 文件夹链接 |
| B | 建一个 API 密钥，让网页能读这些视频 | 这个密钥（一串字母数字） |
| C | 建一个“收作业”的小程序，孩子的视频存进你的私人文件夹（Claude 自动部署，你点几下授权） | 队伍口令 |

谁能看到什么：
- **成员直拍**：知道链接的人能看（本来就是 YouTube 上的公开视频）。
- **孩子交的视频**：只有你能看。存在你 Drive 的 `Fancam Submissions` 文件夹里，没有分享给任何人。
- **队伍口令**：只写在 C 部分的小程序里，网页上看不到。

---

## A. 把成员直拍放进 Drive

1. 打开 <https://drive.google.com>，左上角 **New（新建）→ New folder（新建文件夹）**，起名 `Fancams`。
2. 打开这个文件夹，把 Mac 上 `下载/neon-720` 里的 9 个视频拖进去，等上传完成。
3. 回到上一层，在 `Fancams` 文件夹上点右键 → **Share（共享）→ Share**。
4. 在 **General access（一般访问权限）** 那里，把 “Restricted（受限）” 改成 **Anyone with the link（知道链接的任何人）**，右边保持 **Viewer（查看者）**，点 **Done（完成）**。
5. 把**文件夹**的链接发给 Claude 就行（文件名用 `NEON_<成员>.mp4` 这种格式，它会按名字自动对上每个成员）。

> 以后加新歌也一样：新建一个文件夹，传视频，设成“知道链接的任何人可以查看”，复制链接。

## B. 建 API 密钥

1. 打开 <https://console.cloud.google.com>。第一次用会让你同意条款，同意就行，**不需要**填信用卡。
2. 页面最上方点项目选择框 → **New Project（新建项目）**，名字写 `Fancam Compare` → **Create**。等它建好，确认上方显示的是这个项目。
3. 左上角菜单 ☰ → **APIs & Services → Library（库）**，搜 `Google Drive API`，点进去 → **Enable（启用）**。
4. 左边点 **Credentials（凭据）** → 上方 **+ Create credentials → API key**。弹出的密钥先别管，点进这个密钥去改设置（或者点 **Edit API key**）：
   - **Application restrictions（应用限制）** 选 **Websites（网站）**，点 **Add**，填：`https://jqlaura.github.io/*`
   - **API restrictions（API 限制）** 选 **Restrict key（限制密钥）**，下拉里只勾 **Google Drive API**。
   - 点 **Save（保存）**。
5. 复制这个密钥（`AIza` 开头），发给我。

> 有了这两个限制，别人就算拿到这个密钥，也只能在你的网页上用来读 Drive 视频，做不了别的。

## C. 建“收作业”小程序（Apps Script）— 大部分由 Claude 自动完成

小程序的代码在 [`apps-script/Code.gs`](apps-script/Code.gs)。Claude 用 Google 官方的命令行工具 **clasp** 在你的账号里建项目、上传代码、部署；你只需要点三下：

1. **打开 Apps Script API**：打开 <https://script.google.com/home/usersettings>，把 **Google Apps Script API** 切到 **On**。
2. **给 clasp 授权**：Claude 运行 `clasp login`，你的浏览器会弹出 Google 登录页 → 选你的账号 → **Allow**。（如果提示 “Google hasn't verified this app”，点 **Continue**。clasp 是 Google 官方的开源工具。）
3. **定一个队伍口令**告诉 Claude（比如 `stars2026`，别用孩子的名字或生日）。

然后 Claude 会：建项目 `Novae Dance Hub — Submit` → 上传代码（只在上传的那一份里填口令，仓库里没有）→ 部署成网页应用（以你的身份运行，任何人可以访问）→ 把 `/exec` 网址填进 `assignments.json`。

4. **允许它存文件到你的 Drive**（Google 规定这一步必须本人点）：Claude 会给你一个编辑器链接。打开后，上方函数下拉框选 **setup** → 点 **▶ Run** → **Review permissions** → 选你的账号 → 看到 “Google hasn't verified this app” 就点 **Advanced → Go to … (unsafe)** → **Allow**。这是你自己的程序，所以 Google 没审核过，没关系。下方日志会出现 `Submissions folder: https://drive.google.com/...`，这就是收作业的文件夹。

> “任何人可以访问”的意思是孩子不用登录 Google 就能交作业；但没有队伍口令，什么都传不进来，也看不到任何东西。

### 以后要改口令

告诉 Claude 新口令，它会重新上传并更新部署，网址不变。（自己改也可以：在编辑器里改最上面的 `TEAM_CODE` → ⌘S → **Deploy → Manage deployments** → ✏ → **Version: New version** → **Deploy**。）

---

## D. 网页上线（GitHub Pages）

我已经检查过仓库：没有孩子的视频、口令或密钥，历史里的视频都是合成的假视频。可以公开。

1. 打开 <https://github.com/jqlaura/novae-dance-hub>，登录 → 上方 **Settings**。
2. 拉到最下面 **Danger Zone** → **Change visibility** → **Change to public**，按提示确认。
3. 左边点 **Pages**。**Build and deployment** 下面：Source 选 **Deploy from a branch**，Branch 选 **main**、文件夹 **/ (root)** → **Save**。
4. 等 1–2 分钟，刷新这个页面，上方会显示网址：**https://jqlaura.github.io/novae-dance-hub/**（会自动跳到直拍对比页面）。这就是发给孩子的链接。

---

## 做完以后

- 把 Drive 文件夹链接、API 密钥、队伍口令发给 Claude，它会填进 `assignments.json` 并部署 C。
- 把队伍口令告诉孩子（口令不会出现在网页或仓库里）。
- 孩子交的视频会出现在 Drive 的 `Fancam Submissions/<作业名>/`，文件名是 `名字 · 成员 · 日期 时间.mp4`。

## 常见问题

- **孩子说 “That team code isn't right”**：口令打错了（大小写无所谓）。如果你改过口令，记得按上面“以后要改口令”重新部署。
- **成员视频一直 “Couldn't load”**：检查 A 第 4 步，文件夹是不是 “Anyone with the link”；检查 B 第 4 步的网址是不是 `https://jqlaura.github.io/*`。
- **上传到一半失败**：一般是网络断了，让孩子重新点 Submit（会从头再传）。整首歌大约 75 MB，最好连 Wi‑Fi。
- **免费额度**：Apps Script 免费账号每天可以调用 2 万次网络请求，一个视频大约 10 次，够用。
