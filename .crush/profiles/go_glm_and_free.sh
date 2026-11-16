#!/usr/bin/env bash
# Profile: go_glm_and_free
# Crush-порт .opencode/profiles/go_glm_and_free.json.
# OpenCode-маппинг: primary/plan/build/researcher/reviewer = glm-5.3-flash,
#                   coder/explore/scribe = opencode/big-pickle.
# big-pickle в Crush недоступен (провайдера opencode нет) — вместо него
# ставим ближайший аналог opencode-go/deepseek-v4.1-flash.
model large opencode-go/glm-5.3-flash
model small opencode-go/deepseek-v4.1-flash
