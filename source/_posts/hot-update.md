---
title: 把发版自动化以后，事情更多了
date: 2026-03-11 23:30:00
description: 把 SCP 换成 GitHub Actions 之后，第二天就出事了。
categories:
  - 项目
tags:
  - 部署
  - 折腾
cover: /img/covers/cover-1.svg
top_img: /img/covers/cover-1.svg
---

最早发版本的时候我用 SCP。

把代码打个包传服务器，登上去解压，重启服务，看一眼日志，搞定。一开始一周一次还行；等到改 bug 多了一天发两次，这套手动流程就变得很烦。

后来我接了 GitHub Actions 自动 release。

push 到 main 触发流水线、读 `static/version.txt`、生成 `update_files.json`、创建 release。听起来很顺。

写起来才发现真正难的不是构建，是清单。

哪些文件该进热更包？哪些不该进？我第一版定规则的时候很乐观——所有 `.py`、`.html`、`.js` 都进。

跑了第二天就出事了。

`global_config.yml` 一起更新过去，覆盖了用户的本地配置。`data/` 目录里的运行时数据也带了进去。`node_modules` 装进了热更包。问题一大堆，全是我没想清楚"哪些文件是开发态的、哪些是运行态的"。

现在这份排除清单我审了不下十遍：用户配置、运行时目录、Docker 文件、CI 文件、文档、数据库、日志、缓存、备份目录——一律不进热更。

后来还支持了 `deleted_files` 列表清理旧文件。这个能力又踩了一个坑——清理之前必须先备份原文件，不然万一要回滚，发现东西已经被删了。

干这件事让我相信一句话——

自动化的难点几乎从来不是"自动什么"。是想清楚"绝对不能自动什么"。
