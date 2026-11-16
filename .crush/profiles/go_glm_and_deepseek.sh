#!/usr/bin/env bash
# Profile: go_glm_and_deepseek
# Crush-порт .opencode/profiles/go_glm_and_deepseek.json.
# OpenCode-маппинг: primary/plan/build/researcher/reviewer = glm-5.3-flash,
#                   coder/explore/scribe = deepseek-v4.1-flash.
# У Crush всего два слота: large (основная модель) и small (вспомогательная).
model large opencode-go/glm-5.3-flash
model small opencode-go/deepseek-v4.1-flash
