---
title: 买家昵称又被"系统消息"污染了
date: 2026-05-18 18:00:00
description: 订单列表里冒出来一个买家叫「工作台通知」。
categories:
  - 项目
tags:
  - 数据
  - 折腾
cover: /img/covers/cover-3.svg
top_img: /img/covers/cover-3.svg
---

那天打开订单列表，看到买家昵称列出现了「工作台通知」。

我愣了一下——这不是买家，这是消息中心的系统通知标题。

类似的还有「交易消息」「等待你发货」「我完成了评价」「快给ta一个评价吧～」。这些都是闲鱼推过来的系统消息标题，被我的代码当作买家昵称写进了订单表。

这种污染老早就修过一轮——年初那次只过滤了「订单」「全部」「交易消息」这几个明显的，后来又冒出新的种类。

这次我把过滤逻辑抽成函数 `_sanitize_order_buyer_nick`：先看是不是已知的系统标题（精确匹配），再看里面有没有系统词关键字（包含匹配）。

精确名单加上了这次新发现的「买家」「工作台通知」：

```python
invalid_exact_titles = {
    "订单", "全部", "交易消息", "等待你发货",
    "买家", "工作台通知",
    "我完成了评价",
    "你人真不错，送你闲鱼小红花",
    "卖家人不错？送Ta闲鱼小红花",
    "快给ta一个评价吧～",
}
```

关键字补了一批包含词——「小红花」「待付款」「待发货」「评价」「发货」「付款」「拍下」「确认」「关闭」之类。

光过滤还不够。还要决定**用什么去写库**。

之前的写法是：拿到新昵称就更新，哪怕新的是脏的。后来我加了一个 `_resolve_order_buyer_nick_for_write`——先尝试用新值，脏了就用库里已有的旧值，再脏就写 NULL。意思就是：不能让一个污染过的系统标题覆盖掉一个之前正确写入的买家昵称。

```python
sanitized_incoming = self._sanitize_order_buyer_nick(buyer_nick)
if sanitized_incoming:
    return sanitized_incoming
sanitized_existing = self._sanitize_order_buyer_nick(existing_buyer_nick)
if sanitized_existing:
    return sanitized_existing
return None
```

这套逻辑修完后，订单列表里那些奇怪的「买家昵称」就没再出现过。

但我现在已经不指望这是最后一次。平台那边的系统消息标题随便加一个新的，我这边就得跟一次。

数据脏不脏，关键不在过滤多严，而在「污染发生时，会不会盖掉已经干净的那份」。

把后者守住，前者就只是个长名单的问题。
