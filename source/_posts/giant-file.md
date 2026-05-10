---
title: 这个文件已经一万六千行了
date: 2026-04-22 23:40:00
description: 光标拉到底部，行号停在 16436。
categories:
  - 项目
tags:
  - 重构
  - 折腾
cover: /img/covers/cover-2.svg
top_img: /img/covers/cover-2.svg
---

那天我打开 `XianyuAutoAsync.py`，VS Code 卡了一下才把文件渲染出来。

光标拉到底部，行号停在 16436。

写第一版的时候这个文件大概 3000 行。慢慢加功能、慢慢补 bug、慢慢长成现在这样。每次改东西都得先 grep 一遍，确认这一处不会牵连别的地方。

最近梳理优化方向，我把它列在 P0 里。

但拆这种文件不能拍脑袋。

我现在想清楚一件事——先拆结构，不改逻辑。

具体说就是按域切：连接的进 `ws_connection`、消息分发进 `message_dispatch`、订单的进 `order_flow`、自动回复的进 `auto_reply`。每一块的代码原样搬过去，连缩进都不动。

只搬，不优化。

理由很简单：拆完之后还能跑得起来，是接下来一切优化的前提。如果你边拆边改，出了 bug 都分不清是「拆错了」还是「改错了」。

`reply_server.py` 也一样，13000 行，路由和业务混在一起。我打算先按 auth / cookies / orders / notifications / system 这五块拆出去。

数据层那个 9000 多行的 `db_manager.py` 是最后才动的——它牵的最深，先把上层稳住再说。

写到这我也清楚——这种拆分要花很长时间，不会一两天搞完。

但要是不开始，就永远在「等以后有空」里推。
