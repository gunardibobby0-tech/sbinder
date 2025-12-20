import type { Express, RequestHandler } from "express";

// Simple mock authentication - no Replit required
const MOCK_USER = {
  id: "user_1",
  email: "user@studiobinder.local",
  firstName: "Studio",
  lastName: "User",
};

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    }
  }
}

export function setupAuth(app: Express) {
  // Simple middleware that sets a mock user
  app.use((req, res, next) => {
    (req as any).user = MOCK_USER;
    req.isAuthenticated = () => true;
    next();
  });
}

export async function registerAuthRoutes(app: Express) {
  app.get("/api/auth/user", (req, res) => {
    res.json(MOCK_USER);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  next();
};
