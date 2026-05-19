---
title: 扫码登录页不是风控
date: 2026-05-09 01:00:00
description: 一个误判把账号自动暂停了。
categories:
  - 项目
tags:
  - 反爬
  - 折腾
cover: /img/covers/cover-1.svg
top_img: /img/covers/cover-1.svg
---

那天又收到一条告警：账号被自动暂停，原因写着「身份验证」。

我心里咯噔一下——人脸？短信？打开后台一看，弹的是闲鱼的普通扫码登录页。

也就是说，cookie 过期了、登录态丢了，平台让用户重新扫码登录而已。

这压根不是风控。

之前的代码里，所有要「人工介入」的场景被一锅烩了：人脸验证、短信验证、二维码身份核验、登录页——只要识别到任何一种，都走「暂停账号 + 推通知 + 等人来」那条路径。

我当时图省事，觉得反正都要让人来一下。但实际上：

- 人脸/短信/二维码验证，是平台明确针对这个账号的风控动作，必须暂停。
- 登录页，是登录态自然失效，重新扫一下就好，是正常生命周期。

把它们当一回事处理之后，每次 cookie 过期都会触发"账号被暂停"的告警，又得手动恢复。

修起来其实就两块。

一个是判断函数加白名单——`login_page` 这种类型不进暂停逻辑：

```python
def _should_pause_for_manual_verification(verification_type, verification_context):
    if verification_context in MANUAL_VERIFICATION_CONTEXTS:
        return False
    if verification_type == 'login_page':
        return False
    return True
```

另一个是通知模板里给 `login_page` 单独起个名字「扫码登录」，跟「人脸验证」「短信验证」并列展示，让我自己看告警时能一眼分清楚。

写完才意识到——很多自动化里所谓的"误报"，其实不是检测错了，是后面那一步的反应错了。

检测都对，反应过激，也叫坏。
