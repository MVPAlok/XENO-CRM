import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { isEmailVerified: false, emailVerificationToken: { not: null } },
    select: { email: true, emailVerificationToken: true },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (users.length > 0) {
    console.log(`\n=== EMAIL: ${users[0].email} ===`);
    console.log(`=== TOKEN: ${users[0].emailVerificationToken} ===\n`);
  } else {
    console.log("\nNo pending verification tokens found in the database.\n");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
