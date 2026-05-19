---
title: 滑块过了，cookie 却落到了 taobao 域
date: 2026-05-19 21:00:00
description: 网关回了一句「FAIL_SYS_ILLEGAL_ACCESS」我才看明白。
categories:
  - 项目
tags:
  - 反爬
  - 折腾
cover: /img/covers/cover-2.svg
top_img: /img/covers/cover-2.svg
---

那条日志我记得很清楚。

滑块通过，cookie 拿到，回写数据库，触发 token 刷新——网关回了一句：

```
FAIL_SYS_ILLEGAL_ACCESS::非法请求
```

我第一反应是：刚刚过的那个滑块是假的吧？

但是再跑一次，滑块顺利过，cookie 也确实拿到了，下一秒签接口又是这条错误。

蹲下来打 cookie 全量看，才看出哪里不对——

新的 `_m_h5_tk` 的 domain 是 `.taobao.com`。

我后面要签的接口是 `h5api.m.goofish.com`。token 长在隔壁家的域，自然签不过。

复盘整个滑块流程：闲鱼的滑块拦截页通过后，浏览器经常会跳到 `www.taobao.com`，然后新的 `_m_h5_tk` 就被网关挂在了 `.taobao.com` 域。我的代码原来直接快照当前页面 context 的所有 cookie——拿到的就是 `.taobao.com` 域的那个。

修法分两层。

第一层是**回访主域**。滑块过了之后，如果当前 URL 不在 `goofish.com`，主动 `goto` 一下 `https://www.goofish.com/`，等几秒让网关在 `.goofish.com` 域上重新颁发一份 H5 token：

```python
if 'goofish.com' not in current_host:
    self.page.goto('https://www.goofish.com/',
                   wait_until='domcontentloaded', timeout=8000)
    time.sleep(1.5)
```

回访失败就 try/except 退回原行为，不影响以前能跑通的链路。

第二层是**域名优先**。同名 cookie 可能两个域都有，快照的时候得让 goofish 那个赢。`_snapshot_context_cookies` 加了个可选参数 `preferred_domain_suffixes`，默认 `None`（老调用方零影响），只在滑块成功路径上显式传 `('goofish.com',)`：

```python
new_cookies = self._snapshot_context_cookies(
    self.context,
    page=self.page,
    preferred_domain_suffixes=('goofish.com',),
)
```

把同名 cookie 压扁成 `{name: value}` 时，按 domain 后缀偏好排个序，goofish 的那一份先入字典。

两层一加，FAIL_SYS_ILLEGAL_ACCESS 就再没出现过。

写完这段我又想起一件事——

闲鱼和淘宝在底层是一家。前端看着两个站，cookie 层面其实一直在互相影响。之前 token 刷新踩的坑、滑块跳转踩的坑，几乎都跟「我以为只有 goofish 域，实际两边都在」有关。

所以现在每次写跟 cookie 相关的代码，我都会多问自己一句：

它会不会被另一个域抢走？
