import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SUBJECTS = ["Mathematics", "Physics", "Chemistry"];
const ALL_CLASSES = ["CLASS_8", "CLASS_9", "CLASS_10", "CLASS_11", "CLASS_12"] as const;

async function main() {
  for (const name of SUBJECTS) {
    const subject = await db.subject.upsert({
      where: { name },
      update: { applicableClasses: [...ALL_CLASSES] },
      create: { name, applicableClasses: [...ALL_CLASSES] },
    });
    console.log(`Seeded subject: ${subject.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });