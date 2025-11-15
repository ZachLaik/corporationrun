// From javascript_log_in_with_replit blueprint
import passport from "passport";
import { type Express, type Request } from "express";
import type { IStorage } from "./storage";

// Temporary: Skip OIDC setup until we can debug the openid-client version issue
// import { Issuer, Strategy } from "openid-client";

export type User = Express.User;

export function setupAuth(app: Express, storage: IStorage) {
  const issuerUrl = process.env.ISSUER_URL || "https://replit.com";
  const clientId = process.env.CLIENT_ID || "REPLIT";
  const clientSecret = process.env.CLIENT_SECRET || "REPLIT_SECRET";
  const audience = process.env.AUDIENCE || "";

  let loginUrl = "";

  // TODO: Fix openid-client import issue
  // For now, create a demo user for testing
  console.log("WARNING: Using demo auth mode - not production ready");
  
  const demoUser = {
    id: "demo-user-123",
    email: "demo@corporation.run",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
  };

  // Create demo user in database and establish session
  storage.upsertUser(demoUser)
    .then(user => {
      console.log("Demo user created:", user.email);
    })
    .catch(console.error);

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get("/api/login", (req, res) => {
    if (loginUrl) {
      res.redirect(loginUrl);
    } else {
      res.status(500).send("Authentication not configured");
    }
  });

  app.get(
    "/api/auth/callback",
    passport.authenticate("oidc", { failureRedirect: "/api/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    // Demo mode: always return demo user
    const user = await storage.getUser("demo-user-123");
    if (!user) {
      return res.status(500).json({ error: "Demo user not found in database" });
    }
    return res.json(user);
  });
}

export function requireAuth(req: Request, res: any, next: any) {
  // Demo mode: auto-inject demo user into all requests
  if (!req.user) {
    req.user = { id: "demo-user-123" } as any;
  }
  next();
}

