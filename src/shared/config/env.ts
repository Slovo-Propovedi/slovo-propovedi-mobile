import { z } from 'zod'

// Required build-time configuration, validated once at module load (no defaults —
// a missing var must fail fast, not ship a broken URL). Adapted from exarh-web's
// vite-plugin-validate-env approach. Bare hostnames only (see .env.example);
// babel-preset-expo inlines the process.env.EXPO_PUBLIC_* reads at bundle time.
const hostnameSchema = z
  .string()
  .regex(/^[a-z0-9.-]+$/i, 'must be a bare hostname: no protocol, path, or trailing slash')

// Mobile repository coordinates (same values as the Forgejo org variables
// REPOSITORY_URL, REPOSITORY_ORG, MIRROR_CODEBERG_URL, MIRROR_CODEBERG_ORG,
// MIRROR_GITHUB_ORG, MOBILE_REPOSITORY_NAME). They define where updates come
// from AND the update-download allowlist, so the shape is strict: hosts are
// bare https origins, names plain slugs — nothing that could widen a prefix.
const originSchema = z
  .string()
  .regex(
    /^https:\/\/[a-z0-9.-]+(:[0-9]+)?$/i,
    'must be a bare https origin: no path or trailing slash',
  )
const slugSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'must be a plain org/repository slug')

const envSchema = z.object({
  backendApiHostname: hostnameSchema,
  landingHostname: hostnameSchema,
  mirrorCodebergOrg: slugSchema,
  mirrorCodebergUrl: originSchema,
  mirrorGithubOrg: slugSchema,
  mobileRepositoryName: slugSchema,
  repositoryOrg: slugSchema,
  repositoryUrl: originSchema,
  webHostname: hostnameSchema,
})

const parsedEnv = envSchema.safeParse({
  backendApiHostname: process.env.EXPO_PUBLIC_BACKEND_API_HOSTNAME,
  landingHostname: process.env.EXPO_PUBLIC_LANDING_HOSTNAME,
  mirrorCodebergOrg: process.env.EXPO_PUBLIC_MIRROR_CODEBERG_ORG,
  mirrorCodebergUrl: process.env.EXPO_PUBLIC_MIRROR_CODEBERG_URL,
  mirrorGithubOrg: process.env.EXPO_PUBLIC_MIRROR_GITHUB_ORG,
  mobileRepositoryName: process.env.EXPO_PUBLIC_MOBILE_REPOSITORY_NAME,
  repositoryOrg: process.env.EXPO_PUBLIC_REPOSITORY_ORG,
  repositoryUrl: process.env.EXPO_PUBLIC_REPOSITORY_URL,
  webHostname: process.env.EXPO_PUBLIC_WEB_HOSTNAME,
})

if (!parsedEnv.success) {
  const problems = parsedEnv.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`Invalid environment configuration (see .env.example):\n${problems.join('\n')}`)
}

export const ENV = parsedEnv.data
