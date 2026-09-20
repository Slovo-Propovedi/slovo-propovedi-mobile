/**
 * Shared types for kdco registry plugins.
 *
 * @module kdco-primitives/types
 */

import type { Plugin } from "@opencode/plugin"

/**
 * OpenCode plugin context type.
 *
 * Ported to the V2 plugin API: the V1 `createOpencodeClient` client object no
 * longer exists, and plugin code receives a {@link Plugin.Context} whose domain
 * methods (`ctx.session`, `ctx.agent`, `ctx.permission`, ...) replace the V1
 * `client.*` calls. The historical `OpencodeClient` name is kept so call sites
 * in shared helpers do not need to be renamed.
 */
export type OpencodeClient = Plugin.Context
