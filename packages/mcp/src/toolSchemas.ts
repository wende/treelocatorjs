import { z } from "zod";

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export const selectorSchema = z.object({
  sessionId: z.string().min(1).optional(),
  selector: z.string().min(1),
  index: z.number().int().min(0).optional(),
});

export const getTreeSchema = z.object({
  sessionId: z.string().min(1).optional(),
  selector: z.string().min(1).optional(),
  maxDepth: z.number().int().min(0).max(50).optional(),
  maxNodes: z.number().int().min(1).max(5000).optional(),
  includeHidden: z.boolean().optional(),
  includeText: z.boolean().optional(),
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
  maxDepth: z.number().int().min(0).max(50).optional(),
  maxNodes: z.number().int().min(1).max(5000).optional(),
  includeHidden: z.boolean().optional(),
  includeText: z.boolean().optional(),
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

export const queryBySourceSchema = z.object({
  sessionId: z.string().min(1).optional(),
  file: z.string().min(1),
  line: z.number().int().min(1),
  column: z.number().int().min(0).optional(),
  tolerance: z.number().int().min(0).optional(),
  includeHidden: z.boolean().optional(),
  includeStyles: z.boolean().optional(),
  includeCssReport: z.boolean().optional(),
  maxMatches: z.number().int().min(1).max(100).optional(),
});
