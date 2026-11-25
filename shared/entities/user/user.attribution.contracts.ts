import { z } from "zod";

const utmValue = z
  .string()
  .trim()
  .max(512)
  .transform((value) => value || null)
  .nullable()
  .default(null);
export const marketingTouchSchema = z
  .strictObject({
    touch_id: z.string().trim().min(1).max(128),
    captured_at: z.iso.datetime(),
    utm_source: utmValue,
    utm_medium: utmValue,
    utm_campaign: utmValue,
    utm_content: utmValue,
    utm_term: utmValue,
  })
  .refine((touch) =>
    Boolean(
      touch.utm_source ||
        touch.utm_medium ||
        touch.utm_campaign ||
        touch.utm_content ||
        touch.utm_term,
    ),
  );
export type MarketingTouch = z.output<typeof marketingTouchSchema>;
export const userAttributionSchema = z.object({
  userId: z.number().int().positive(),
  utm: marketingTouchSchema.nullable(),
});
export type UserAttribution = z.output<typeof userAttributionSchema>;
