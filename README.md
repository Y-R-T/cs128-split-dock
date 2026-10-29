# CS 128 Split-Screen Code Dock 🚀

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square&logo=googlechrome)
![Browser](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Arc-success?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20%E7%AE%80%E4%B8%AD%20%7C%20%E7%B9%81%E4%B8%AD-informational?style=flat-square)
![Course](https://img.shields.io/badge/UIUC-CS%20128-FF5F05?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

**[English](#english) | [中文说明](#中文说明)**

---

<a name="english"></a>

## 📖 Overview

On the UIUC **CS 128 (`cs128.org`)** course website, the official full-screen mode expands the coding workspace to cover the entire viewport, hiding all surrounding context (such as textbook walkthroughs, learning objectives, or preceding code concepts). When you are a beginner trying to learn and code at the same time, this forces you to constantly exit full-screen or scroll up and down, which is quite frustrating.

**CS 128 Split-Screen Code Dock** is a lightweight browser extension that adds a **"Dock Right"** button to every coding workspace. Instead of a disruptive full-screen view, it transforms the page into a clean, **LeetCode-style left-right split screen**—keeping the problem description and textbook notes fully visible on the left while you code and run tests on the right.

---

## ✨ Key Features

- **◫ One-Click Split-Screen**: Dock or undock any `Programming Activity`, `Additional Practice`, or `Runnable` code editor directly from the file tab bar.
- **↔️ Resizable Split Ratio**: Drag the left edge of the docked panel to adjust the width between `30vw` and `68vw`. Your preferred width is saved automatically.
- **🛡️ 100% Native Compatibility**: Preserves all original DOM nodes and event listeners. `Run`, `Grade`, `Save`, `History` diff modals, and file drag-and-drop uploads work without any issues.
- **🌐 Auto i18n Support**: Automatically detects your browser language (`en`, `zh-CN`, `zh-TW`) and renders the UI accordingly.
- **🌗 Native Theme Sync**: Built with CS 128's Bootstrap 5.3 CSS variables, supporting both **Light Mode** and **Dark Mode** seamlessly.
- **🔄 Session Persistence**: Remembers which workspace you docked across page reloads and theme switches.

---

## 📦 Installation

### Option 1: Download ZIP (Recommended for Students)
1. Click the green **`<> Code`** button at the top right of this GitHub page, then select **`Download ZIP`**.
2. **Unzip / Extract** the downloaded file to a permanent folder on your computer *(do not delete this folder after installing)*.
3. Open your browser's Extensions page:
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
   - **Brave / Arc**: Navigate to `brave://extensions/` or `arc://extensions/`
4. Turn on the **Developer mode** toggle (top-right in Chrome, left sidebar in Edge).
5. Click **Load unpacked** (top-left) and select the extracted `cs128-split-dock` folder.
6. Refresh any lesson page on `cs128.org` and click **`◫ Dock Right`** on the right side of the file tab bar!

### Option 2: Git Clone (For Developers)
```bash
git clone https://github.com/Y-R-T/cs128-split-dock.git
```
Then load the cloned directory via **Load unpacked** in `chrome://extensions/`.

---

## 🛠️ How to Use

| Action | How to Trigger |
| --- | --- |
| **Dock to Right** | Click **`◫ Dock Right`** on the right end of the file tabs (`includes/...`, `src/...`). |
| **Resize Panel** | Hover over the left border of the right panel until the blue highlight appears, then drag left/right. |
| **Undock (Restore)** | Click **`✕ Undock`** at the top-right of the code editor, or click **`Restore Here`** in the dashed placeholder box inside the problem text. |
| **Switch Activity** | Clicking the dock button on another activity automatically undocks the previous one and docks the new one. |

---

## 🇨🇳 中文说明

### 简介

在 UIUC **CS 128 (`cs128.org`)** 课程网站写练习题时，官方自带的全屏模式（Full-screen）虽然放大了代码框，但会把周围所有的题干说明、上方知识点和上下关联内容全部隐藏。对于刚接触这门课、需要经常对照教程和知识点进行实践的同学来说，频繁在全屏与上下滚动之间切换非常不友好。

本扩展应运而生。我们在每个代码框的文件标签栏右侧注入了一个 **「◫ 右置代码框」**（英文浏览器下为 **`◫ Dock Right`**）按钮，点击后不会像官方全屏那样丢失上下文，而是直接打造一个清爽的**左侧看题/看笔记、右侧写代码并跑测试的左右分屏体验**。

### 核心特性

* **左题右码，无需来回翻页**：完美解决官方全屏模式下看不到上下文的痛点，新手查阅知识点和写代码效率倍增。
* **一键右置与还原**：支持页面内所有的 `Programming Activity`、`Additional Practice` 以及正文中的 `Runnable` 演示代码框，多题之间点击即可自动互斥切换。
* **自由拖拽调宽**：鼠标移至右侧代码框左边缘即可左右拖动调整分屏比例（`30vw` ~ `68vw`），并自动记忆你的宽度偏好。
* **多语言自动适配（i18n）**：根据浏览器首选语言（`navigator.language`）自动切换英文、简体中文或繁体中文界面。
* **零功能冲突**：完全保留原页面 DOM 引用与事件绑定，`Run`、`Grade`、`Save`、拖拽上传代码文件、`History` 历史提交对比弹窗、以及 Ace Editor 光标定位全部原样正常工作。
* **深浅主题自适应**：原生复用网站内置的 Bootstrap 5.3 CSS 变量，切换 Light / Dark 模式或刷新页面后自动恢复分屏状态。

### 安装步骤（Windows / macOS 通用）
1. **下载代码**：点击本页面右上角绿色的 **`<> Code`** 按钮，选择 **`Download ZIP`**。
2. **提取文件**：将下载好的 `.zip` 文件完整提取（Unzip / Extract）到电脑上一个平时不会删除的固定目录中。
3. **打开扩展管理页**：
   - **Chrome** 地址栏输入：`chrome://extensions/`
   - **Edge** 地址栏输入：`edge://extensions/`
4. **开启开发者模式**：打开页面右上角（Edge 在左侧栏）的 **「开发者模式 (Developer mode)」** 开关。
5. **加载扩展**：点击左上角的 **「加载已解压的扩展程序 (Load unpacked)」**，选中刚才提取出来的文件夹即可完成安装。
6. **开始使用**：回到 `cs128.org` 刷新课程页面，点击代码框右上角的 **`◫ 右置代码框`**（或 **`◫ Dock Right`**）即可开启分屏。

---

## 📄 License

This project is licensed under the GNU GPL v3 License.