import { z } from 'zod';
import { 
  insertProjectSchema, projects, 
  insertDocumentSchema, documents,
  insertContactSchema, contacts,
  insertEventSchema, events,
  insertUserSettingsSchema,
  insertCrewSchema, crew,
  insertCrewAssignmentSchema, crewAssignments
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:id',
      input: insertProjectSchema.partial(),
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/documents',
      input: insertDocumentSchema,
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/documents/:id',
      input: insertDocumentSchema.partial(),
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/documents/import',
      input: z.object({
        content: z.string(),
        fileName: z.string(),
        model: z.string().optional(),
      }),
      responses: {
        201: z.object({
          script: z.custom<typeof documents.$inferSelect>(),
          contacts: z.array(z.custom<typeof contacts.$inferSelect>()),
          events: z.array(z.custom<typeof events.$inferSelect>()),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/documents/:id/generate',
      input: z.object({
        prompt: z.string(),
        model: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
  },
  contacts: {
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/contacts',
      responses: {
        200: z.array(z.custom<typeof contacts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/contacts',
      input: insertContactSchema,
      responses: {
        201: z.custom<typeof contacts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contacts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/events',
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.object({
          openrouterToken: z.string().optional(),
          preferredModel: z.string().optional(),
        }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings',
      input: z.object({
        openrouterToken: z.string().optional(),
        preferredModel: z.string().optional(),
      }),
      responses: {
        200: z.object({
          openrouterToken: z.string().optional(),
          preferredModel: z.string().optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    models: {
      method: 'GET' as const,
      path: '/api/settings/models',
      responses: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
        })),
      },
    },
  },
  crew: {
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/crew',
      responses: {
        200: z.array(z.custom<typeof crew.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/crew',
      input: insertCrewSchema,
      responses: {
        201: z.custom<typeof crew.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:projectId/crew/:crewId',
      input: insertCrewSchema.partial(),
      responses: {
        200: z.custom<typeof crew.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:projectId/crew/:crewId',
      responses: {
        204: z.void(),
      },
    },
  },
  crewAssignments: {
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/crew-assignments',
      responses: {
        200: z.array(z.custom<typeof crewAssignments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/crew-assignments',
      input: insertCrewAssignmentSchema,
      responses: {
        201: z.custom<typeof crewAssignments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    checkConflicts: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/crew-assignments/check-conflicts',
      input: z.object({
        crewId: z.number(),
        eventId: z.number(),
      }),
      responses: {
        200: z.object({
          hasConflict: z.boolean(),
          conflicts: z.array(z.object({
            eventId: z.number(),
            eventTitle: z.string(),
            startTime: z.date(),
            endTime: z.date(),
          })),
        }),
        400: errorSchemas.validation,
      },
    },
  },
};

// ============================================
// URL HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ProjectInput = z.infer<typeof api.projects.create.input>;
export type DocumentInput = z.infer<typeof api.documents.create.input>;
export type ContactInput = z.infer<typeof api.contacts.create.input>;
export type EventInput = z.infer<typeof api.events.create.input>;
export type DocumentImportInput = z.infer<typeof api.documents.import.input>;
export type DocumentGenerateInput = z.infer<typeof api.documents.generate.input>;
export type SettingsInput = z.infer<typeof api.settings.update.input>;
