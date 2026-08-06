import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const adminEmail = "htkhawlhring12@gmail.com";
  const supabaseUserId = "b71effc8-7ac5-491e-81b0-162f4aebb873"; 

  // Remove old record with mismatched ID
  await db.user.deleteMany({ where: { email: adminEmail } });

  // Create MongoDB user with matching Supabase UID
  const admin = await db.user.create({
    data: {
      id: supabaseUserId,
      email: adminEmail,
      fullName: "Centre Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Successfully synced Admin User: ${admin.email} (ID: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });