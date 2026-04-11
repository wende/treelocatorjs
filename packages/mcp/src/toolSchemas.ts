import { z } from "zod";

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export const selectorSchema = z.object({
  sessionId: z.string().min(1).optional(),
  selector: z.string().min(1),
  index: z.number().int().min(0).optional(),
});

export const getStylesSchema = selectorSchema.extend({
  options: z
    .object({
      includeDefaults: z.boolean().optional(),
    })
    .optional(),
});

export const getCssReportSchema = selectorSchema.extend({
  properties: z.array(z.string().min(1)).optional(),
});

export const typeSchema = selectorSchema.extend({
  text: z.string().min(1),
  submit: z.boolean().optional(),
});

export const takeSnapshotSchema = z.object({
  sessionId: z.string().min(1).optional(),
  selector: z.string().min(1),
  snapshotId: z.string().min(1),
  index: z.number().int().min(0).optional(),
  label: z.string().optional(),
});

export const snapshotIdSchema = z.object({
  sessionId: z.string().min(1).optional(),
  snapshotId: z.string().min(1),
});

export const executeJsSchema = z.object({
  sessionId: z.string().min(1).optional(),
  code: z.string().min(1),
});

export const getConsoleSchema = z.object({
  sessionId: z.string().min(1).optional(),
  last: z.number().int().min(1).max(500).optional(),
});
