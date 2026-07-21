# GitHub Pages 发布说明

这个项目已经准备好发布到 GitHub Pages。

## 推荐仓库名

如果这是你的主个人主页，推荐新建仓库：

```text
你的GitHub用户名.github.io
```

发布后的网址会是：

```text
https://你的GitHub用户名.github.io/
```

如果你使用其他仓库名，例如 `wei-zheng-homepage`，发布后的网址会是：

```text
https://你的GitHub用户名.github.io/wei-zheng-homepage/
```

项目里的 GitHub Actions workflow 已经会自动识别这两种情况。

## 发布步骤

1. 在 GitHub 新建一个 public repository。
2. 把本文件夹内容推送到该仓库的 `main` 分支。
3. 打开仓库的 `Settings` -> `Pages`。
4. 在 `Build and deployment` 里选择 `GitHub Actions`。
5. 等待 Actions 里的 `Deploy to GitHub Pages` 运行成功。

之后每次修改网站并推送到 `main`，GitHub Pages 会自动更新。
## 本地测试 GitHub Pages 构建

PowerShell 中可以运行：

`powershell
='true'
=''
npm run github:build
` 
