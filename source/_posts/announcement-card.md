---
title: 公告太长，把仪表盘卡片撑变形了
date: 2026-05-19 20:20:00
description: 仪表盘公告卡片越来越高，关闭按钮被挤到了角落。
categories:
  - 项目
tags:
  - 前端
  - 折腾
cover: /img/covers/cover-1.svg
top_img: /img/covers/cover-1.svg
---

发完 v2.0.0 那天我打开仪表盘，看到公告卡片高度变成了原来的两倍多。

公告内容写得有点多——版本号、亮点、迁移说明，几行都堆在那里。卡片高度撑起来之后，旁边的「关闭」按钮被顶到了边上，看起来很别扭。

最先想到的修法是「截断」——只显示前 N 个字，加省略号。但写多长其实没规律，截字数不漂亮。

后来改成 CSS 三件套：

```css
.dashboard-announcement-message {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
```

让浏览器自己处理两行省略。卡片高度就被锁住了。

光锁高度还不够。卡片本来 `align-items: flex-start`——内容顶对齐，关闭按钮跟着顶在右上角。如果消息只有一行，按钮就显得空着掉在上面。改成 `align-items: center` 之后，无论内容多少，关闭按钮总在卡片垂直中线上：

```css
.dashboard-announcement-card { align-items: center; }
.dashboard-announcement-actions { align-items: center; }
```

不过两行省略也不能解决所有情况。有些公告本来就需要展开看全文。所以我顺便给公告结构加了一个 `summary` 字段——后端从 `announcement.json` 读出来透传给前端，前端优先展示摘要，回退到原 message：

```javascript
const display = announcement.summary || announcement.message;
```

这样写公告的时候，我可以同时写两个版本：一句话的摘要在仪表盘上展示，完整版在点开后看。

整件事修完才回过头来想——很多前端的"显示问题"，第一反应是动 CSS，结果发现真正的问题是数据形状不对。

CSS 解决「再长也别撑爆」。
数据层多加一个 summary 字段才能解决「我想让它显示啥」。

两边都补一点，问题才算真正闭环。
