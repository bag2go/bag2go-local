import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthReq extends Request {
  userId?: string;
  role?: "USER" | "ADMIN";
}

export function requireAuth(role: "USER" | "ADMIN" | "ANY" = "ANY") {
  return (req: AuthReq, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (
        role !== "ANY" &&
        payload.role !== role &&
        payload.role !== "ADMIN"
      )
        return res.sendStatus(403);
      req.userId = payload.sub;
      req.role = payload.role;
      next();
    } catch {
      res.sendStatus(401);
    }
  };
}
