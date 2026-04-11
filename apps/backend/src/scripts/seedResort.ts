import { prisma } from "../db/prisma";
import type { Resort } from "@prisma/client";

export async function createResort(name: string, guestId: string): Promise<Resort> {
  const resort = await prisma.resort.create({
    data: {
      name,
      guestId,
      moneyCents: 500,
      lastTickAt: new Date(),
      lifts: {
        create: {
          liftModelKey: "magic_carpet",
          status: "working",
          currentBreakProbability: 0.002,
        },
      },
    },
  });

  return resort;
}

async function main() {
  const [, , name, guestId] = process.argv;

  if (!name || !guestId) {
    console.error("Usage: ts-node src/scripts/seedResort.ts <name> <guestId>");
    process.exit(1);
  }

  const resort = await createResort(name, guestId);
  console.log(`Resort created:`);
  console.log(`  id:       ${resort.id}`);
  console.log(`  name:     ${resort.name}`);
  console.log(`  guest ID: ${resort.guestId}`);
  console.log(`  money:    $${(resort.moneyCents / 100).toFixed(2)}`);

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
