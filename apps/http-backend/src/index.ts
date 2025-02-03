import express from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { middleware } from "./middleware";
import {
  CreateRoomSchema,
  CreateUserSchema,
  SigninSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import { Request, Response } from "express";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "invalid inputs",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

  try {
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        name: parsedData.data.name,
        password: hashedPassword,
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "user already exists",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Incorrect Inputs",
    });
    return;
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: parsedData.data.username,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid Credentials",
      });
      return;
    }

    const isPassValid = await bcrypt.compare(
      parsedData.data.password,
      user.password
    );

    if (!isPassValid) {
      res.status(401).json({
        message: "Invalid Credentials",
      });
      return;
    }

    const userId = user.id;

    const token = jwt.sign(
      {
        userId: userId,
        email: user.email,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } catch (e) {
    res.status(500).json({
      message: "error during signin",
    });
  }
});

app.post("/room", middleware, async (req: Request, res: Response) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Invalid Input",
    });
    return;
  }

  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });
    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(500).json({
      message: "Room already exists",
    });
  }
});

app.listen(3001);
