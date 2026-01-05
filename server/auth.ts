import type { Express, RequestHandler } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { hashPassword, validatePassword, validateEmail } from "./auth-utils";
import { api } from "@shared/routes";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    }
    interface SessionData {
      userId?: string;
    }
  }
}

export function setupAuth(app: Express) {
  // Set up PostgreSQL session store
  const PgSession = ConnectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'studiobinder-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  }));

  // Authentication middleware
  app.use(async (req, res, next) => {
    const userId = req.session?.userId;
    if (userId) {
      try {
        // Load user data and attach to request
        const user = await storage.getUserByEmail(userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          };
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    next();
  });

  // Helper method for passport-like interface
  app.use((req, res, next) => {
    (req as any).isAuthenticated = () => !!req.user;
    next();
  });
}

export async function registerAuthRoutes(app: Express) {
  // Registration endpoint
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      // Validation
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format", field: "email" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: passwordValidation.errors.join(", "), 
          field: "password" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        passwordHash,
      });

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email and password are required",
          field: !email ? "email" : "password"
        });
      }

      const user = await storage.validateUserCredentials(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set up session
      if (req.session) {
        req.session.userId = user.email;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          res.json(user);
        });
      } else {
        res.status(500).json({ message: "Session not available" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get(api.auth.user.path, (req, res) => {
    if (!(req as any).isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Logout endpoint
  app.post(api.auth.logout.path, (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if ((req as any).isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};