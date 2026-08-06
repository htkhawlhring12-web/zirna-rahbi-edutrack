import { PrismaClient } from "@prisma/client";

// Next.js reloads modules frequently in development, which would otherwise
// create a new PrismaClient (and a new DB connection pool) on every reload.
// Caching the client on the global object avoids that.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
