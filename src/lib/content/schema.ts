// Content schemas. Browser-safe: no Node imports here.
import { z } from "zod";

const kebabId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case");

export const sourceSchema = z.object({ title: z.string().min(1), url: z.string().optional() });
export type Source = z.infer<typeof sourceSchema>;

export const claimSchema = z.object({
  id: z.string().min(1),
  fen: z.string().min(1),
  move: z.string().optional(), // SAN
  assert: z.enum(["wins", "mistake", "best", "equal"]),
});
export type Claim = z.infer<typeof claimSchema>;

export const linksSchema = z.object({
  patterns: z.array(z.string()).optional(),
  openings: z.array(z.string()).optional(),
  games: z.array(z.string()).optional(),
  combinations: z.array(z.string()).optional(),
});
export type Links = z.infer<typeof linksSchema>;

export const positionSchema = z.object({
  fen: z.string().min(1),
  solution: z.array(z.string().min(1)).min(1), // UCI, user moves first
  caption: z.string().optional(),
});
export type Position = z.infer<typeof positionSchema>;

const baseShape = {
  id: kebabId,
  title: z.string().min(1),
  order: z.number(),
  sources: z.array(sourceSchema).min(1),
  links: linksSchema.optional(),
  claims: z.array(claimSchema).optional(),
  body: z.string(),
};

const themedShape = {
  themes: z.array(z.string()).optional(),
  examples: z.array(positionSchema).min(1).max(3),
  positions: z.array(positionSchema).optional(),
};

export const patternSchema = z
  .object({ ...baseShape, kind: z.literal("pattern"), ...themedShape })
  .refine((p) => (p.themes?.length ?? 0) >= 1 || (p.positions?.length ?? 0) >= 10, {
    message: "a pattern needs themes (at least 1) or positions (at least 10)",
    path: ["themes"],
  });
export type Pattern = z.infer<typeof patternSchema>;

export const techniqueSchema = z.object({
  ...baseShape,
  kind: z.literal("technique"),
  ...themedShape,
});
export type Technique = z.infer<typeof techniqueSchema>;

export const combinationSchema = z.object({
  ...baseShape,
  kind: z.literal("combination"),
  game: z.object({
    white: z.string(),
    black: z.string(),
    year: z.number(),
    event: z.string(),
  }),
  fen: z.string().min(1),
  solution: z.array(z.string().min(1)).min(1), // UCI
  expect: z.enum(["mate", "material"]),
  materialGain: z.number().optional(),
});
export type Combination = z.infer<typeof combinationSchema>;

const plyKey = z.string().regex(/^\d+$/, "ply key must be a number");

export const gameSchema = z.object({
  ...baseShape,
  kind: z.literal("game"),
  white: z.string(),
  black: z.string(),
  year: z.number(),
  event: z.string(),
  site: z.string(),
  referencePgn: z.string().min(1), // file in content/sources
  moves: z.array(z.string()).min(1), // SAN from the start
  side: z.enum(["w", "b"]),
  segments: z.array(z.object({ from: z.number().int().min(1), to: z.number().int().min(1) })),
  alternatives: z
    .record(plyKey, z.array(z.object({ san: z.string(), comment: z.string() })))
    .optional(),
  comments: z.record(plyKey, z.string()).optional(),
});
export type Game = z.infer<typeof gameSchema>;

export const MAX_OPENING_PLIES = 24;

export const openingSchema = z.object({
  ...baseShape,
  kind: z.literal("opening"),
  eco: z.string().min(1),
  lines: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      side: z.enum(["w", "b"]),
      moves: z.array(z.string()).min(1).max(MAX_OPENING_PLIES), // SAN
      idea: z.string(),
    }),
  ),
  traps: z
    .array(z.object({ name: z.string(), moves: z.array(z.string()), comment: z.string() }))
    .optional(),
});
export type Opening = z.infer<typeof openingSchema>;

export const contentItemSchema = z.discriminatedUnion("kind", [
  patternSchema,
  techniqueSchema,
  combinationSchema,
  gameSchema,
  openingSchema,
]);
export type ContentItem = z.infer<typeof contentItemSchema>;
export type ContentKind = ContentItem["kind"];
