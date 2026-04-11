/* eslint-disable @typescript-eslint/no-namespace */
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email?: string;
        role: "USER" | "ADMIN";
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
