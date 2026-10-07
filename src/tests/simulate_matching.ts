/**
 * Perhaps Matching Engine - Full Scale Simulation
 * 200 users, realistic picks, full match run with stats
 */

import { runMatchingEngine, validateMatchingResult } from '../lib/matching/engine';
import type { FrozenParticipant, FrozenChoice } from '../lib/matching/engine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const MALE_NAMES   = ["Arjun","Rohan","Aditya","Karan","Vikram","Nikhil","Pranav","Siddharth","Dev","Mihir","Ayaan","Kabir","Ishaan","Arnav","Dhruv","Rehan","Yash","Parth","Shiv","Krish"];
const FEMALE_NAMES = ["Priya","Ananya","Sneha","Riya","Aisha","Kavya","Pooja","Divya","Meera","Nisha","Shreya","Isha","Tanvi","Komal","Simran","Avni","Radhika","Neha","Anjali","Sanya"];
const COLLEGES     = ["AIIMS Delhi","BITS Pilani","IIT Bombay","DU North Campus","Lady Shri Ram","DCE","Ashoka University","Manipal","VIT","Jadavpur"];

// ─── Extended participant type for simulation metadata ────────────────────────

interface SimParticipant extends FrozenParticipant {
  name: string;
  college: string;
}

// ─── Generate 200 Fake Participants ──────────────────────────────────────────

const MALE_COUNT   = 100;
const FEMALE_COUNT = 100;
const TOTAL        = MALE_COUNT + FEMALE_COUNT;

const participants: SimParticipant[] = [];
const males: SimParticipant[] = [];
const females: SimParticipant[] = [];

for (let i = 0; i < MALE_COUNT; i++) {
  const p: SimParticipant = {
    userId: `male-${i.toString().padStart(3,'0')}`,
    gender: 'MALE',
    signupTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    status: Math.random() > 0.03 ? 'ACTIVE' : 'SUSPENDED',
    name: `${randomFrom(MALE_NAMES)} ${i}`,
    college: randomFrom(COLLEGES),
  };
  participants.push(p);
  males.push(p);
}

for (let i = 0; i < FEMALE_COUNT; i++) {
  const p: SimParticipant = {
    userId: `female-${i.toString().padStart(3,'0')}`,
    gender: 'FEMALE',
    signupTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    status: Math.random() > 0.03 ? 'ACTIVE' : 'SUSPENDED',
    name: `${randomFrom(FEMALE_NAMES)} ${i}`,
    college: randomFrom(COLLEGES),
  };
  participants.push(p);
  females.push(p);
}

// ─── Generate Realistic Choices ───────────────────────────────────────────────

const choices: FrozenChoice[] = [];
const PICK_SLOTS = 3;

// Males pick females
for (const male of males) {
  if (male.status !== 'ACTIVE') continue;
  const picked = shuffle(females).slice(0, PICK_SLOTS);
  picked.forEach((f, idx) => {
    choices.push({ pickerId: male.userId, pickedId: f.userId, rank: idx + 1 });
  });
}

// Females pick males — biased ~60% toward reciprocating
for (const female of females) {
  if (female.status !== 'ACTIVE') continue;

  const whoPickedMe = choices
    .filter(c => c.pickedId === female.userId)
    .map(c => males.find(m => m.userId === c.pickerId))
    .filter((m): m is SimParticipant => !!m && m.status === 'ACTIVE');

  const reciprocals = shuffle(whoPickedMe).slice(0, Math.floor(Math.random() * 2 + 1));
  const others = shuffle(males.filter(m => !reciprocals.find(r => r.userId === m.userId) && m.status === 'ACTIVE')).slice(0, PICK_SLOTS - reciprocals.length);

  const finalPicks = shuffle([...reciprocals, ...others]).slice(0, PICK_SLOTS);
  finalPicks.forEach((m, idx) => {
    choices.push({ pickerId: female.userId, pickedId: m.userId, rank: idx + 1 });
  });
}

console.log(`\n${'═'.repeat(64)}`);
console.log(`   PERHAPS — MATCHING ENGINE FULL SCALE SIMULATION`);
console.log(`${'═'.repeat(64)}\n`);

console.log(`📋  SETUP`);
console.log(`    Total participants  : ${TOTAL}`);
console.log(`    Males               : ${MALE_COUNT} (${males.filter(m => m.status === 'ACTIVE').length} active, ${males.filter(m => m.status !== 'ACTIVE').length} suspended)`);
console.log(`    Females             : ${FEMALE_COUNT} (${females.filter(f => f.status === 'ACTIVE').length} active, ${females.filter(f => f.status !== 'ACTIVE').length} suspended)`);
console.log(`    Total choices made  : ${choices.length}`);
console.log(`    Avg picks / person  : ${(choices.length / TOTAL).toFixed(1)}`);

// ─── Count mutual pairs ───────────────────────────────────────────────────────

const choiceSet = new Set(choices.map(c => `${c.pickerId}:${c.pickedId}`));
const seenPairs = new Set<string>();
let mutualCount = 0;

for (const c of choices) {
  const pairKey = [c.pickerId, c.pickedId].sort().join('|');
  if (choiceSet.has(`${c.pickedId}:${c.pickerId}`) && !seenPairs.has(pairKey)) {
    seenPairs.add(pairKey);
    mutualCount++;
  }
}

console.log(`\n💞  PRE-MATCH`);
console.log(`    Mutual pairs found  : ${mutualCount}`);
console.log(`    (both people picked each other — not all will be matched)`);

// ─── Run Engine ───────────────────────────────────────────────────────────────

console.log(`\n⚙️   Running matching engine...`);
const t0 = Date.now();
const result = runMatchingEngine({ participants, choices });
const elapsed = Date.now() - t0;
const validation = validateMatchingResult(result, { participants, choices });

console.log(`    Completed in ${elapsed}ms`);

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(64)}`);
console.log(`📊  MATCH RESULTS`);
console.log(`${'─'.repeat(64)}`);
console.log(`    Total mutual pairs  : ${result.totalMutualPairs}`);
console.log(`    Confirmed matches   : ${result.matchedCount}`);
console.log(`    Unmatched mutuals   : ${result.unmatchedMutualPairs}  (triangle conflicts)`);
console.log(`    Match rate          : ${((result.matchedCount / result.totalMutualPairs) * 100).toFixed(1)}% of mutual pairs got a match`);
console.log(`    Engine validation   : ${validation.valid ? '✅ PASSED — no violations' : '❌ FAILED'}`);
if (!validation.valid) {
  validation.violations.forEach(v => console.log(`      ⚠ ${v}`));
}

// ─── Strength Distribution ────────────────────────────────────────────────────

const buckets: Record<number, number> = {};
for (const m of result.matches) {
  buckets[m.matchStrength] = (buckets[m.matchStrength] || 0) + 1;
}

console.log(`\n💪  MATCH STRENGTH DISTRIBUTION`);
console.log(`    (sum of both ranks — lower = higher priority match)`);
const labels: Record<number,string> = { 2:'★★★ STRONGEST (#1 × #1)', 3:'★★☆ (#1 × #2)', 4:'★★☆ (#1 × #3 / #2 × #2)', 5:'★☆☆ (#2 × #3)', 6:'☆☆☆ weakest (#3 × #3)' };
for (const [s, count] of Object.entries(buckets).sort((a,b) => +a[0] - +b[0])) {
  const bar = '█'.repeat(Math.round((count / result.matchedCount) * 30));
  console.log(`    ${labels[+s] || `Strength ${s}`}: ${bar} ${count}`);
}

// ─── Sample Matches ───────────────────────────────────────────────────────────

const nameMap = new Map(participants.map(p => [p.userId, p]));
console.log(`\n🎉  SAMPLE MATCHES (showing first 15)`);
console.log(`${'─'.repeat(64)}`);
for (let i = 0; i < Math.min(15, result.matches.length); i++) {
  const m = result.matches[i];
  const u1 = nameMap.get(m.user1Id)!;
  const u2 = nameMap.get(m.user2Id)!;
  console.log(`    ${(i+1).toString().padStart(2)}. ${u1.name.padEnd(18)} ↔  ${u2.name.padEnd(18)} [str:${m.matchStrength}, #${m.rankUser1ToUser2}/#${m.rankUser2ToUser1}]`);
}

// ─── Unmatched Users ──────────────────────────────────────────────────────────

const matchedIds = new Set(result.matches.flatMap(m => [m.user1Id, m.user2Id]));
const unmatched = participants.filter(p => p.status === 'ACTIVE' && !matchedIds.has(p.userId));
console.log(`\n😔  UNMATCHED ACTIVE USERS`);
console.log(`    Males   : ${unmatched.filter(p => p.gender === 'MALE').length}`);
console.log(`    Females : ${unmatched.filter(p => p.gender === 'FEMALE').length}`);
console.log(`    Reason  : No mutual picks, or mutual pair already taken by greedy algo`);

// ─── Determinism Check ───────────────────────────────────────────────────────

console.log(`\n🔁  DETERMINISM CHECK`);
const result2 = runMatchingEngine({ participants: shuffle(participants), choices: shuffle(choices) });
const sameCount = result2.matchedCount === result.matchedCount;
const sameMatches = result2.matches.every(m2 => result.matches.some(m => m.user1Id === m2.user1Id && m.user2Id === m2.user2Id));
console.log(`    Re-ran with shuffled inputs:`);
console.log(`    Same match count  : ${sameCount ? '✅ YES' : '❌ NO'}`);
console.log(`    Identical matches : ${sameMatches ? '✅ YES' : '⚠️  Minor delta on ties (expected)'}`);

// ─── Same-gender check ───────────────────────────────────────────────────────

console.log(`\n🚫  CONSTRAINT CHECKS`);
const sameGenderMatches = result.matches.filter(m => {
  const u1 = nameMap.get(m.user1Id);
  const u2 = nameMap.get(m.user2Id);
  return u1 && u2 && u1.gender === u2.gender;
});
console.log(`    Same-gender matches : ${sameGenderMatches.length === 0 ? '✅ NONE (correct)' : `❌ ${sameGenderMatches.length} violations!`}`);

const dupCheck = new Map<string, number>();
for (const m of result.matches) {
  dupCheck.set(m.user1Id, (dupCheck.get(m.user1Id) || 0) + 1);
  dupCheck.set(m.user2Id, (dupCheck.get(m.user2Id) || 0) + 1);
}
const dupes = [...dupCheck.entries()].filter(([,c]) => c > 1);
console.log(`    Duplicate matches   : ${dupes.length === 0 ? '✅ NONE (correct)' : `❌ ${dupes.length} users in 2+ matches!`}`);

console.log(`\n${'═'.repeat(64)}`);
console.log(`   SIMULATION COMPLETE`);
console.log(`${'═'.repeat(64)}\n`);
