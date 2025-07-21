import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { sendManifest } from "./lib/airlineAdapter.js";
import { requireAuth, AuthReq } from "./middleware/auth.js";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

/* ---------- auth routes ---------- */
app.post("/auth/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const hash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash: hash, firstName, lastName },
  });
  const token = jwt.sign({ sub: user.id, role: "USER" }, process.env.JWT_SECRET!);
  res.json({ token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.passwordHash, password)))
    return res.sendStatus(401);
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!);
  res.json({ token });
});

/* ---------- checkout (creates order + Stripe session) ---------- */
const orderSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  pickupAddress: z.string(),
  pickupTime: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
  bags: z.number().int().min(1),
  hazItems: z.boolean(),
  declarations: z.string().optional(),
});

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

app.post("/api/checkout", requireAuth("USER"), async (req: AuthReq, res) => {
  const data = orderSchema.parse(req.body);
  const order = await prisma.order.create({
    data: {
      userId: req.userId!,
      airlineCode: data.airline,
      flightNumber: data.flightNumber,
      flightDate: new Date(data.pickupTime),
      pickupISO: new Date(data.pickupTime),
      status: OrderStatus.PENDING,
      bags: {
        createMany: {
          data: Array.from({ length: data.bags }).map((_, i) => ({
            tagNumber: `${Date.now()}-${i}`,
            weightKg: 0,
          })),
        },
      },
    },
    include: { bags: true },
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: data.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Bag pickup" },
          unit_amount: 2000,
        },
        quantity: data.bags,
      },
    ],
    metadata: { orderId: order.id },
    success_url: `${process.env.DOMAIN}/summary/${order.id}`,
    cancel_url: `${process.env.DOMAIN}/schedule?cancelled=1`,
  });

  res.json({ sessionId: session.id });
});

/* ---------- Stripe webhook ---------- */
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error ${(err as Error).message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.TSA_CLEAR },
          include: { bags: true },
        });
        const msgId = await sendManifest(order);
        if (msgId)
          await prisma.order.update({ where: { id: orderId }, data: { airlineMsgId: msgId } });
      }
    }
    res.json({ received: true });
  }
);

/* ---------- user history ---------- */
app.get("/api/my/orders", requireAuth("USER"), async (req: AuthReq, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId },
    include: { bags: true },
  });
  res.json(orders);
});

app.get("/healthz", (_, res) => res.send("ok"));

const port = 8080;
app.listen(port, () => console.log("API running on :" + port));
