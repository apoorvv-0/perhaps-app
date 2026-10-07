/**
 * Perhaps Matching Engine - Full Scale Simulation
 * 200 users, realistic picks, full match run with stats
 */

const { runMatchingEngine, validateMatchingResult } = require('./src/lib/matching/engine');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

const MALE_NAMES   = ["Arjun","Rohan","Aditya","Karan","Vikram","Nikhil","Pranav","Siddharth","Dev","Mihir","Ayaan","Kabir","Ishaan","Arnav","Dhruv","Rehan","Yash","Parth","Shiv","Krish"];
const FEMALE_NAMES = ["Priya","Ananya","Sneha","Riya","Aisha","Kavya","Pooja","Divya","Meera","Nisha","Shreya","Isha","Tanvi","Komal","Simran","Avni","Radhika","Neha","Anjali","Sanya"];
const COLLEGES     = ["AIIMS Delhi","BITS Pilani","IIT Bombay","DU North Campus","Lady Shri Ram","Delhi College of Engineering","Ashoka University","Manipal","VIT","Jadavpur"];

// ─── Generate 200 Fake Participants ──────────────────────────────────────────

const MALE_COUNT   = 100;
const FEMALE_COUNT = 100;
const TOTAL        = MALE_COUNT + FEMALE_COUNT;

const participants = [];
const males = [];
const females = [];

for (let i = 0; i < MALE_COUNT; i++) {
  const p = {
    userId: `male-${i.toString().padStart(3,'0')}`,
    gender: 'MALE',
    signupTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // random within past week
    status: Math.random() > 0.03 ? 'ACTIVE' : 'SUSPENDED', // 3% suspended
    name: `${randomFrom(MALE_NAMES)} ${i}`,
    college: randomFrom(COLLEGES),
  };
  participants.push(p);
  males.push(p);
}

for (let i = 0; i < FEMALE_COUNT; i++) {
  const p = {
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

// ─── Generate Realistic Choices (3 picks each, some mutual) ──────────────────

const choices = [];

const PICK_SLOTS = 3; // Each person gets 3 picks

// Males pick females
for (const male of males) {
  if (male.status !== 'ACTIVE') continue;
  const picked = shuffle([...females]).slice(0, PICK_SLOTS);
  picked.forEach((f, idx) => {
    choices.push({ pickerId: male.userId, pickedId: f.userId, rank: idx + 1 });
  });
}

// Females pick males — with ~60% chance of picking back someone who picked them (for realistic mutual rate)
for (const female of females) {
  if (female.status !== 'ACTIVE') continue;

  // Find who picked this female
  const whoPickedMe = choices
    .filter(c => c.pickedId === female.userId)
    .map(c => males.find(m => m.userId === c.pickerId))
    .filter(Boolean);

  // With 60% chance, bias toward picking back
  const reciprocals = shuffle(whoPickedMe).slice(0, Math.floor(Math.random() * 2 + 1));
  const others = shuffle(males.filter(m => !reciprocals.includes(m) && m.status === 'ACTIVE')).slice(0, PICK_SLOTS - reciprocals.length);
  
  const finalPicks = shuffle([...reciprocals, ...others]).slice(0, PICK_SLOTS);
  finalPicks.forEach((m, idx) => {
    choices.push({ pickerId: female.userId, pickedId: m.userId, rank: idx + 1 });
  });
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`   PERHAPS MATCHING ENGINE — FULL SCALE SIMULATION`);
console.log(`${'═'.repeat(60)}\n`);

console.log(`📋  SETUP`);
console.log(`    Total participants : ${TOTAL}`);
console.log(`    Males              : ${MALE_COUNT} (${males.filter(m => m.status === 'ACTIVE').length} active)`);
console.log(`    Females            : ${FEMALE_COUNT} (${females.filter(f => f.status === 'ACTIVE').length} active)`);
console.log(`    Total choices made : ${choices.length}`);
console.log(`    Avg picks/person   : ${(choices.length / TOTAL).toFixed(1)}`);

// ─── Count mutual pairs before matching ──────────────────────────────────────

let mutualCount = 0;
const choiceSet = new Set(choices.map(c => `${c.pickerId}:${c.pickedId}`));
const seenPairs = new Set();
for (const c of choices) {
  const reverse = `${c.pickedId}:${c.pickerId}`;
  const pairKey = [c.pickerId, c.pickedId].sort().join('|');
  if (choiceSet.has(reverse) && !seenPairs.has(pairKey)) {
    seenPairs.add(pairKey);
    mutualCount++;
  }
}

console.log(`\n💞  PRE-MATCH STATS`);
console.log(`    Mutual pairs found : ${mutualCount}`);
console.log(`    (both people picked each other — not all will be matched)`);

// ─── Run Matching Engine ──────────────────────────────────────────────────────

console.log(`\n⚙️   Running matching engine...`);
const t0 = Date.now();
const result = runMatchingEngine({ participants, choices });
const elapsed = Date.now() - t0;

// ─── Validate Result ──────────────────────────────────────────────────────────

const validation = validateMatchingResult(result, { participants, choices });

console.log(`    Done in ${elapsed}ms\n`);

console.log(`${'─'.repeat(60)}`);
console.log(`📊  MATCH RESULTS`);
console.log(`${'─'.repeat(60)}`);
console.log(`    Total mutual pairs    : ${result.totalMutualPairs}`);
console.log(`    Confirmed matches     : ${result.matchedCount}`);
console.log(`    Unmatched mutual pairs: ${result.unmatchedMutualPairs} (triangle conflicts)`);
console.log(`    Match rate            : ${((result.matchedCount / result.totalMutualPairs) * 100).toFixed(1)}% of mutuals got a match`);
console.log(`    Engine valid          : ${validation.valid ? '✅ YES' : '❌ NO'}`);
if (!validation.valid) {
  console.log(`    Violations: ${validation.violations.join(', ')}`);
}

// ─── Match Strength Distribution ─────────────────────────────────────────────

const strengthBuckets = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
for (const m of result.matches) {
  strengthBuckets[m.matchStrength] = (strengthBuckets[m.matchStrength] || 0) + 1;
}

console.log(`\n💪  MATCH STRENGTH DISTRIBUTION`);
console.log(`    (strength = rank_A_to_B + rank_B_to_A; lower = stronger)`);
for (const [strength, count] of Object.entries(strengthBuckets).sort((a,b) => a[0]-b[0])) {
  const bar = '█'.repeat(Math.round(count / result.matchedCount * 40));
  const label = strength == 2 ? '(#1 × #1 — best!)' : strength == 6 ? '(#3 × #3 — weakest)' : '';
  console.log(`    Strength ${strength}: ${bar} ${count} ${label}`);
}

// ─── Sample Matches ───────────────────────────────────────────────────────────

const nameMap = new Map(participants.map(p => [p.userId, p]));

console.log(`\n🎉  SAMPLE MATCHES (first 10)`);
console.log(`${'─'.repeat(60)}`);
const sample = result.matches.slice(0, 10);
for (let i = 0; i < sample.length; i++) {
  const m = sample[i];
  const u1 = nameMap.get(m.user1Id);
  const u2 = nameMap.get(m.user2Id);
  const r1 = m.rankUser1ToUser2 || '?';
  const r2 = m.rankUser2ToUser1 || '?';
  console.log(`    ${(i+1).toString().padStart(2)}. ${u1.name.padEnd(20)} ↔  ${u2.name.padEnd(20)} [strength: ${m.matchStrength}, ranks: #${r1}/#${r2}]`);
}

// ─── Who got left out ────────────────────────────────────────────────────────

const matchedIds = new Set(result.matches.flatMap(m => [m.user1Id, m.user2Id]));
const unmatched = participants.filter(p => p.status === 'ACTIVE' && !matchedIds.has(p.userId));
const unmatchedMales = unmatched.filter(p => p.gender === 'MALE').length;
const unmatchedFemales = unmatched.filter(p => p.gender === 'FEMALE').length;

console.log(`\n😔  UNMATCHED ACTIVE USERS`);
console.log(`    Males   : ${unmatchedMales}`);
console.log(`    Females : ${unmatchedFemales}`);
console.log(`    Reason  : No mutual pick found, or their mutual pair was taken`);

// ─── Determinism check ───────────────────────────────────────────────────────

console.log(`\n🔁  DETERMINISM CHECK`);
const result2 = runMatchingEngine({ participants: shuffle([...participants]), choices: shuffle([...choices]) });
const same = result2.matchedCount === result.matchedCount &&
  result2.matches.every(m2 => result.matches.some(m => m.user1Id === m2.user1Id && m.user2Id === m2.user2Id));
console.log(`    Shuffled input, re-ran engine...`);
console.log(`    Same match count  : ${result2.matchedCount === result.matchedCount ? '✅ YES' : '❌ NO'}`);
console.log(`    Identical matches : ${same ? '✅ YES' : '⚠️  MINOR DELTA (tie-breaking may differ)'}`);

console.log(`\n${'═'.repeat(60)}`);
console.log(`   SIMULATION COMPLETE`);
console.log(`${'═'.repeat(60)}\n`);
