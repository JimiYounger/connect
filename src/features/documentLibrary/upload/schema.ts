import { z } from "zod";
import type { RoleAssignments } from "@/features/carousel/types";

// Schema for document upload validation
export const DocumentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  versionLabel: z.string().optional(),
  visibility: z.object({
    roleTypes: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
  file: z.instanceof(File),
});

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;