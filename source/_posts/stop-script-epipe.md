---
title: stop.sh 一停服务，日志被刷屏了
date: 2026-05-09 23:50:00
description: 杀进程的顺序错了，node 子进程对着已关闭的管道狂写 EPIPE。
categories:
  - 项目
tags:
  - 折腾
  - 部署
cover: /img/covers/cover-2.svg
top_img: /img/covers/cover-2.svg
---

`stop.sh` 一直是这个项目里最不起眼的那个文件。

一句 `pkill -f Start.py`，加一句 `sleep 2`，看着就够用。

直到我开始接扫码登录的 lite 链路——`utils/gen_tfstk.js` 和 `utils/et_f.js` 这两个 node 脚本是通过 execjs 从 Python 拉起来的子进程。它们的 stdout 接在 Python 主进程上。

问题就在这里。

`pkill -f Start.py` 先把 Python 干掉，node 子进程一时半会还活着，继续往那个已经关闭的管道写日志——`write EPIPE`、`EPIPE`、`EPIPE`，刷了一屏。

每次重启服务，控制台都被这堆错误刷一遍。看着像出了大事，其实只是停得姿势不对。

把顺序调一下就好了：

```bash
# 先停 node 子进程
pkill -TERM -f "utils/gen_tfstk.js" 2>/dev/null || true
pkill -TERM -f "utils/et_f.js" 2>/dev/null || true
sleep 0.3

# 再停 Python 主进程
pkill -TERM -f "Start.py"
```

先杀子，再杀父，管道有序关闭，没人对着已经死的对端写数据。

后面再补一道兜底，最后强杀一次没退出的残留 node：

```bash
pkill -9 -f "utils/gen_tfstk.js" 2>/dev/null || true
pkill -9 -f "utils/et_f.js" 2>/dev/null || true
```

调完之后控制台干净了。一个改了三行的小脚本，效果比我新加一个功能还明显。

后来我想——平时关注的都是「跑起来」的链路：消息进、订单出、滑块过。但「停下去」也是链路的一部分。停得不优雅，下次启动前那一屏 EPIPE 会让你忍不住想，是不是哪里又出问题了。

调试的成本，常常是被这种小噪音偷偷拉高的。
