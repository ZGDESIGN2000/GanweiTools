# 企业主页（GitHub Pages）

静态页面：`index.html` + `styles.css`，适合托管在 GitHub Pages。

## 发布到 GitHub Pages

1. 在 GitHub 新建仓库（可设为 Public），将本目录推送到该仓库。
2. 打开仓库 **Settings → Pages**。
3. **Build and deployment** 中：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**（或你用的默认分支），文件夹选 **/ (root)**
4. 保存后等待一两分钟，访问：
   - 普通仓库：`https://你的用户名.github.io/仓库名/`
   - 若仓库名为 `你的用户名.github.io`：`https://你的用户名.github.io/`

根目录下的 `.nojekyll` 用于关闭 Jekyll 处理，避免静态资源被误处理。

## 绑定自己的域名

1. 在 **Settings → Pages → Custom domain** 填写你的域名（如 `www.example.com`），保存。
2. 仓库里会出现 **CNAME** 文件（由 GitHub 生成）；若本地已有 `CNAME`，请只写一行域名，与后台一致。
3. 在域名 DNS 处按 GitHub 文档添加记录：
   - 子域（如 `www`）：**CNAME** 指向 `你的用户名.github.io`
   - 根域名（apex）：使用 **A** 记录指向 GitHub 提供的 IP，或 **ALIAS/ANAME**（视注册商而定），详见 [GitHub 文档：配置自定义域](https://docs.github.com/zh/pages/configuring-a-custom-domain-for-your-github-pages-site)

DNS 生效后，在 Pages 设置里可勾选 **Enforce HTTPS**（证书由 GitHub 自动申请）。

## 本地预览

用浏览器直接打开 `index.html`，或用任意静态服务器（如 VS Code Live Server）预览。
