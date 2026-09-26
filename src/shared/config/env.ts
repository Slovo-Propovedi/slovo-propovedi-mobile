import { z } from 'zod'

// Required build-time configuration, validated once at module load (no defaults —
// a missing var must fail fast, not ship a broken URL). Adapted from exarh-web's
// vite-plugin-validate-env approach. Bare hostnames only (see .env.example);
// babel-preset-expo inlines the process.env.EXPO_PUBLIC_* reads at bundle time.
const hostnameSchema = z
  .string()
  .regex(/^[a-z0-9.-]+$/i, 'must be a bare hostname: no protocol, path, or trailing slash')

const envSchema = z.object({
  backendApiHostname: hostnameSchema,
  landingHostname: hostnameSchema,
  webHostname: hostnameSchema,
})

const parsedEnv = envSchema.safeParse({
  backendApiHostname: process.env.EXPO_PUBLIC_BACKEND_API_HOSTNAME,
  landingHostname: process.env.EXPO_PUBLIC_LANDING_HOSTNAME,
  webHostname: process.env.EXPO_PUBLIC_WEB_HOSTNAME,
})

if (!parsedEnv.success) {
  const problems = parsedEnv.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`Invalid environment configuration (see .env.example):\n${problems.join('\n')}`)
}

export const ENV = parsedEnv.data
