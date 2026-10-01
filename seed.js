/**
 * Seed script with GUARANTEED mutual pairs for testing
 * Run: node seed.js
 *
 * Creates 10 males + 10 females, then sets up choices so:
 *   - At least 5 guaranteed mutual pairs exist
 *   - Rest are random (to test unmatched/greedy logic)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MALE_NAMES = ["Arjun", "Dev", "Karan", "Rahul", "Nikhil", "Aditya", "Rohan", "Vikram", "Siddharth", "Ankit"];
const FEMALE_NAMES = ["Priya", "Ananya", "Riya", "Sneha", "Meera", "Isha", "Tanvi", "Pooja", "Kriti", "Divya"];
const LAST_NAMES = ["Sharma", "Gupta", "Singh", "Patel", "Verma", "Kumar", "Joshi", "Mehta", "Shah", "Nair"];

async function seed() {
  console.log("🌱 Seeding test data with guaranteed mutuals...\n");

  // Find active event
  const event = await prisma.event.findFirst({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!event) {
    console.error("❌ No active event. Login as admin first to auto-create one.");
    return;
  }

  console.log(`✓ Using event: ${event.name}`);

  // Clean up existing test bots
  await prisma.choice.deleteMany({ where: { eventId: event.id } });

  const users = [];

  // Create 20 users (10M + 10F)
  for (let i = 1; i <= 20; i++) {
    const isMale = i <= 10;
    const names = isMale ? MALE_NAMES : FEMALE_NAMES;
    const firstName = names[i <= 10 ? i - 1 : i - 11];
    const lastName = LAST_NAMES[(i - 1) % 10];
    const gender = isMale ? "MALE" : "FEMALE";
    const googleId = `test-bot-${i}`;
    const phone = `9${i.toString().padStart(9, "0")}`;

    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          phoneNumber: phone,
          globalRole: "USER",
          status: "ACTIVE",
        },
      });
    }

    let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          gender,
          college: "KEM Hospital",
          batch: isMale ? (i <= 5 ? "2021" : "2022") : (i <= 15 ? "2021" : "2022"),
          instagramHandle: `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        },
      });
    }

    // Ensure registered in event
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      create: { eventId: event.id, userId: user.id },
      update: {},
    });

    users.push({ ...user, profile, gender });
    process.stdout.write(`  Created: ${firstName} ${lastName} (${gender})\n`);
  }

  const males = users.filter((u) => u.gender === "MALE");
  const females = users.filter((u) => u.gender === "FEMALE");

  // ── Choices: 5 GUARANTEED mutuals ─────────────────────────────
  // Pair 0: male[0] ↔ female[0] (both rank each other #1 — perfect match)
  // Pair 1: male[1] ↔ female[1] (both rank each other #2)
  // Pair 2: male[2] ↔ female[2] (rank 1 and 2 — strong)
  // Pair 3: male[3] ↔ female[3] (rank 3 each — medium)
  // Pair 4: male[4] ↔ female[4] (but male[4] also mutually likes female[5] — greedy conflict test)
  // Pair 5: male[4] ↔ female[5] (stronger pair — should win the greedy)

  const choiceData = [];

  const addChoice = (picker, picked, rank) => {
    choiceData.push({ eventId: event.id, pickerId: picker.id, pickedId: picked.id, rank });
  };

  // Guaranteed pair 1: Arjun ↔ Priya (both rank #1)
  addChoice(males[0], females[0], 1);
  addChoice(females[0], males[0], 1);

  // Guaranteed pair 2: Dev ↔ Ananya (both rank #2)
  addChoice(males[1], females[1], 2);
  addChoice(females[1], males[1], 2);
  // Also give them some random choices to fill lists
  addChoice(males[1], females[2], 1); // Dev likes Riya #1 but Riya doesn't like him back
  addChoice(females[1], males[2], 1); // Ananya likes Karan #1 but Karan doesn't like her back

  // Guaranteed pair 3: Karan ↔ Riya (rank 1 each — stronger than pair 2 above)
  addChoice(males[2], females[2], 1);
  addChoice(females[2], males[2], 1);

  // Guaranteed pair 4: Rahul ↔ Sneha (rank 3 each)
  addChoice(males[3], females[3], 3);
  addChoice(females[3], males[3], 3);
  // Fill their lists
  addChoice(males[3], females[0], 1);
  addChoice(males[3], females[1], 2);
  addChoice(females[3], males[0], 1);
  addChoice(females[3], males[1], 2);

  // Conflict test: Nikhil likes both Meera (#1) and Isha (#2); Meera and Isha both like Nikhil
  // Nikhil-Meera: strength 1+1=2 (should win)
  // Nikhil-Isha: strength 2+2=4 (should lose because Nikhil already matched)
  addChoice(males[4], females[4], 1); // Nikhil → Meera #1
  addChoice(females[4], males[4], 1); // Meera → Nikhil #1  (strength=2, WINS)
  addChoice(males[4], females[5], 2); // Nikhil → Isha #2
  addChoice(females[5], males[4], 2); // Isha → Nikhil #2   (strength=4, LOSES — Nikhil taken)
  // Isha gets no match
  addChoice(females[5], males[5], 1); // Isha also likes Aditya
  // But Aditya doesn't like Isha back

  // Fill remaining users with random non-mutual choices
  const remaining = [...males.slice(5), ...females.slice(6)];
  for (const user of remaining) {
    const targets = user.gender === "MALE" ? females : males;
    const shuffled = [...targets].sort(() => 0.5 - Math.random());
    for (let rank = 1; rank <= Math.min(5, shuffled.length); rank++) {
      // Only add if not already set
      const exists = choiceData.find(
        (c) => c.pickerId === user.id && c.pickedId === shuffled[rank - 1].id
      );
      if (!exists) {
        addChoice(user, shuffled[rank - 1], rank);
      }
    }
  }

  // Write all choices
  await prisma.choice.createMany({ data: choiceData });

  console.log(`\n✅ Done!`);
  console.log(`   👥 ${users.length} users created`);
  console.log(`   💘 ${choiceData.length} choices seeded`);
  console.log(`\n📋 Expected algorithm behaviour:`);
  console.log(`   ✓ Arjun ↔ Priya    (strength 2 — rank #1 each)`);
  console.log(`   ✓ Karan ↔ Riya     (strength 2 — rank #1 each, same strength as Arjun/Priya)`);
  console.log(`   ✓ Dev ↔ Ananya     (strength 4 — rank #2 each)`);
  console.log(`   ✓ Rahul ↔ Sneha    (strength 6 — rank #3 each)`);
  console.log(`   ✓ Nikhil ↔ Meera   (strength 2 — should win over Nikhil/Isha)`);
  console.log(`   ✗ Isha gets NO match (Nikhil taken, Aditya not mutual)`);
  console.log(`\nRun the Dry Run in Admin Panel, then: node export-report.js`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
