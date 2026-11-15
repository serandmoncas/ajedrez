import { z } from "zod";

/** ISO date-time string that parses to a real date (rejects "", "banana"). */
const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}T/.test(s));

/** ts-fsrs 6 `Card` with Date fields serialized as ISO strings. */
export const serializedCardSchema = z.object({
  due: isoDate,
  stability: z.number(),
  difficulty: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: z.number().int().min(0).max(3),
  last_review: isoDate.optional(),
});

export const progressSchema = z.object({
  schemaVersion: z.literal(1),
  cards: z.record(z.string(), serializedCardSchema),
  seenPuzzles: z.record(z.string(), isoDate),
  patternResults: z.record(z.string(), z.array(z.boolean()).max(10)),
  introduced: z.record(z.string(), isoDate),
  games: z.record(
    z.string(),
    z.object({
      segment: z.number(),
      full: z.number(),
      partial: z.number(),
      miss: z.number(),
      done: z.boolean(),
    }),
  ),
  rating: z.object({ r: z.number(), rd: z.number(), updatedAt: isoDate }),
});

export type SerializedCard = z.infer<typeof serializedCardSchema>;
export type Progress = z.infer<typeof progressSchema>;

export function emptyProgress(now: Date): Progress {
  return {
    schemaVersion: 1,
    cards: {},
    seenPuzzles: {},
    patternResults: {},
    introduced: {},
    games: {},
    rating: { r: 1200, rd: 350, updatedAt: now.toISOString() },
  };
}
