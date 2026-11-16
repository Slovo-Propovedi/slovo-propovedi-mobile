#!/usr/bin/env bash
# Profile: zai_and_free
# Crush-порт .opencode/profiles/zai_and_free.json.
# OpenCode-маппинг: primary/plan/build/researcher/reviewer = zai glm-5.3-flash,
#                   coder/explore/scribe = opencode/big-pickle.
# big-pickle в Crush недоступен (провайдера opencode нет) — вместо него
# ставим ближайший аналог opencode-go/deepseek-v4.1-flash.
model large zai/glm-5.3-flash
model small opencode-go/deepseek-v4.1-flash
