/**
 * Export Algorithm Verification Report
 *
 * Run: node export-report.js
 * Output: perhaps-match-report.csv (open in Excel)
 *
 * Sheet 1 (rows): All choices — who picked whom and at what rank
 * Sheet 2 (rows): Final matches — who matched whom, their mutual ranks, match strength
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cols) {
  return cols.map(csvEscape).join(",") + "\n";
}

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!event) {
    console.error("❌ No active event found.");
    return;
  }

  console.log(`✓ Event: ${event.name} (${event.status})`);

  // ── Fetch all data ─────────────────────────────────────────────

  const [profiles, choices, matches] = await Promise.all([
    prisma.profile.findMany({
      where: {
        user: {
          eventRegistrations: { some: { eventId: event.id } },
          status: "ACTIVE",
        },
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        gender: true,
        college: true,
        batch: true,
        instagramHandle: true,
      },
    }),
    prisma.choice.findMany({
      where: { eventId: event.id },
      orderBy: [{ pickerId: "asc" }, { rank: "asc" }],
    }),
    prisma.match.findMany({
      where: { eventId: event.id },
      orderBy: { matchStrength: "asc" },
    }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // ── Build output ───────────────────────────────────────────────

  let out = "";

  // ── SECTION 1: Participants ────────────────────────────────────
  out += "=== PARTICIPANTS ===\n";
  out += row("UserID", "Name", "Gender", "College", "Batch", "Instagram", "Choices Made", "Times Picked");

  const choicesByPicker = new Map();
  const pickCountByPicked = new Map();
  for (const c of choices) {
    if (!choicesByPicker.has(c.pickerId)) choicesByPicker.set(c.pickerId, []);
    choicesByPicker.get(c.pickerId).push(c);
    pickCountByPicked.set(c.pickedId, (pickCountByPicked.get(c.pickedId) || 0) + 1);
  }

  for (const p of profiles) {
    out += row(
      p.userId,
      `${p.firstName} ${p.lastName}`,
      p.gender,
      p.college,
      p.batch,
      `@${p.instagramHandle}`,
      choicesByPicker.get(p.userId)?.length ?? 0,
      pickCountByPicked.get(p.userId) ?? 0
    );
  }

  out += "\n";

  // ── SECTION 2: All Choices (Who Picked Whom) ───────────────────
  out += "=== ALL CHOICES (Who Picked Whom) ===\n";
  out += row("Picker Name", "Picker Gender", "Rank", "Picked Name", "Picked Gender", "Is Mutual?");

  for (const c of choices) {
    const picker = profileMap.get(c.pickerId);
    const picked = profileMap.get(c.pickedId);
    if (!picker || !picked) continue;

    // Check mutual
    const isMutual = choices.some(
      (x) => x.pickerId === c.pickedId && x.pickedId === c.pickerId
    );

    out += row(
      `${picker.firstName} ${picker.lastName}`,
      picker.gender,
      c.rank,
      `${picked.firstName} ${picked.lastName}`,
      picked.gender,
      isMutual ? "YES ✓" : "no"
    );
  }

  out += "\n";

  // ── SECTION 3: Mutual Pairs (Before Deduplication) ───────────────
  out += "=== ALL MUTUAL PAIRS (before greedy matching) ===\n";
  out += row("Person A", "Gender A", "Person B", "Gender B", "Rank A→B", "Rank B→A", "Strength", "Assigned Match?");

  const seenPairs = new Set();
  const mutualPairs = [];

  for (const c of choices) {
    const reverse = choices.find((x) => x.pickerId === c.pickedId && x.pickedId === c.pickerId);
    if (!reverse) continue;

    const pairKey = [c.pickerId, c.pickedId].sort().join("|");
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    mutualPairs.push({
      aId: c.pickerId,
      bId: c.pickedId,
      rankAtoB: c.rank,
      rankBtoA: reverse.rank,
      strength: c.rank + reverse.rank,
    });
  }

  // Sort same as engine
  mutualPairs.sort((a, b) => a.strength - b.strength);

  const matchedUserIds = new Set([
    ...matches.map((m) => m.user1Id),
    ...matches.map((m) => m.user2Id),
  ]);

  for (const pair of mutualPairs) {
    const pA = profileMap.get(pair.aId);
    const pB = profileMap.get(pair.bId);
    if (!pA || !pB) continue;

    const isMatched =
      matchedUserIds.has(pair.aId) &&
      matchedUserIds.has(pair.bId) &&
      matches.some(
        (m) =>
          (m.user1Id === pair.aId && m.user2Id === pair.bId) ||
          (m.user1Id === pair.bId && m.user2Id === pair.aId)
      );

    out += row(
      `${pA.firstName} ${pA.lastName}`,
      pA.gender,
      `${pB.firstName} ${pB.lastName}`,
      pB.gender,
      pair.rankAtoB,
      pair.rankBtoA,
      pair.strength,
      isMatched ? "✓ MATCHED" : "✗ Lost to greedy"
    );
  }

  out += "\n";

  // ── SECTION 4: Final Matches ───────────────────────────────────
  out += "=== FINAL MATCHES (Algorithm Output) ===\n";
  out += row("Rank", "Person 1", "Gender 1", "Instagram 1", "Person 2", "Gender 2", "Instagram 2", "P1 Ranked P2 At", "P2 Ranked P1 At", "Match Strength");

  matches.sort((a, b) => a.matchStrength - b.matchStrength);

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const p1 = profileMap.get(m.user1Id);
    const p2 = profileMap.get(m.user2Id);
    if (!p1 || !p2) continue;

    const rankP1toP2 = choices.find((c) => c.pickerId === m.user1Id && c.pickedId === m.user2Id)?.rank ?? "?";
    const rankP2toP1 = choices.find((c) => c.pickerId === m.user2Id && c.pickedId === m.user1Id)?.rank ?? "?";

    out += row(
      i + 1,
      `${p1.firstName} ${p1.lastName}`,
      p1.gender,
      `@${p1.instagramHandle}`,
      `${p2.firstName} ${p2.lastName}`,
      p2.gender,
      `@${p2.instagramHandle}`,
      rankP1toP2,
      rankP2toP1,
      m.matchStrength
    );
  }

  out += "\n";

  // ── SECTION 5: Unmatched Users ─────────────────────────────────
  out += "=== UNMATCHED PARTICIPANTS ===\n";
  out += row("Name", "Gender", "Instagram", "Choices Made", "Times Picked", "Had Mutual Pairs?");

  const allMatchedIds = new Set([
    ...matches.map((m) => m.user1Id),
    ...matches.map((m) => m.user2Id),
  ]);
  const mutualPairUserIds = new Set([
    ...mutualPairs.map((p) => p.aId),
    ...mutualPairs.map((p) => p.bId),
  ]);

  for (const p of profiles) {
    if (allMatchedIds.has(p.userId)) continue;
    out += row(
      `${p.firstName} ${p.lastName}`,
      p.gender,
      `@${p.instagramHandle}`,
      choicesByPicker.get(p.userId)?.length ?? 0,
      pickCountByPicked.get(p.userId) ?? 0,
      mutualPairUserIds.has(p.userId) ? "Yes (lost to greedy)" : "No"
    );
  }

  // ── Write file ────────────────────────────────────────────────
  const filename = "perhaps-match-report.csv";
  fs.writeFileSync(filename, out, "utf8");

  console.log(`\n✅ Report exported to: ${filename}`);
  console.log(`   📊 ${profiles.length} participants`);
  console.log(`   💘 ${choices.length} total choices`);
  console.log(`   🤝 ${mutualPairs.length} mutual pairs`);
  console.log(`   ✓  ${matches.length} final matches`);
  console.log(`   ✗  ${profiles.length - matches.length * 2} unmatched participants`);
  console.log(`\n   Open perhaps-match-report.csv in Excel to verify the algorithm.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
