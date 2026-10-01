import {z} from 'zod'

export const timeZoneSchema = z.string().max(100).refine((value) => {
  try { new Intl.DateTimeFormat('en', {timeZone: value}); return true } catch { return false }
}, 'Use a valid IANA time zone')

export const profileSchema = z.object({
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional(),
  timeZone: timeZoneSchema.optional(),
  age: z.number().int().min(0).max(130).nullable().optional(),
  employer: z.string().trim().max(200).nullable().optional(),
  usesAI: z.boolean().optional(),
  wantsAgentToSubmit: z.boolean().optional(),
  projectStartedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
    const d = new Date(v); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v
  }, 'Use a real calendar date').nullable().optional(),
  affiliatedProjects: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
}).strict()

export const requestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  profile: profileSchema.optional().default({}),
}).strict()
