import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] ?? "";

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({
      message: "Unauthorized",
    });
  }
}
