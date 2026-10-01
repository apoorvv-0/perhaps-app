/**
 * Perhaps Matching Engine Verification Tests
 *
 * Verifies:
 * 1. Mutual pick requirement (A picks B and B picks A)
 * 2. Cross-gender restriction (only M-F matches allowed)
 * 3. Maximal and greedy by strength
 * 4. Determinism on repeated runs and shuffled input
 * 5. No person in two matches (monogamous)
 * 6. Tie-breaking rules
 */

import { runMatchingEngine, validateMatchingResult } from "../lib/matching/engine";
import type { FrozenParticipant, FrozenChoice, MatchingInput } from "../lib/matching/engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("--- Starting Matching Engine Tests ---");

// Test 1: Simple mutual pair
{
  const p1: FrozenParticipant = {
    userId: "user-male-1",
    gender: "MALE",
    signupTime: new Date("2026-09-01T10:00:00Z"),
    status: "ACTIVE",
  };
  const p2: FrozenParticipant = {
    userId: "user-female-1",
    gender: "FEMALE",
    signupTime: new Date("2026-09-01T10:05:00Z"),
    status: "ACTIVE",
  };
  const choices: FrozenChoice[] = [
    { pickerId: "user-male-1", pickedId: "user-female-1", rank: 1 },
    { pickerId: "user-female-1", pickedId: "user-male-1", rank: 1 },
  ];

  const input: MatchingInput = { participants: [p1, p2], choices };
  const result = runMatchingEngine(input);
  const validation = validateMatchingResult(result, input);

  assert(validation.valid, `Validation failed: ${validation.violations.join(", ")}`);
  assert(result.matchedCount === 1, "Should have 1 match");
  assert(result.matches[0].matchStrength === 2, "Strength should be 1 + 1 = 2");
  console.log("✓ Test 1: Simple mutual pair passed");
}

// Test 2: Same gender pair must NOT match
{
  const p1: FrozenParticipant = {
    userId: "user-male-1",
    gender: "MALE",
    signupTime: new Date("2026-09-01T10:00:00Z"),
    status: "ACTIVE",
  };
  const p2: FrozenParticipant = {
    userId: "user-male-2",
    gender: "MALE",
    signupTime: new Date("2026-09-01T10:05:00Z"),
    status: "ACTIVE",
  };
  const choices: FrozenChoice[] = [
    { pickerId: "user-male-1", pickedId: "user-male-2", rank: 1 },
    { pickerId: "user-male-2", pickedId: "user-male-1", rank: 1 },
  ];

  const input: MatchingInput = { participants: [p1, p2], choices };
  const result = runMatchingEngine(input);
  assert(result.matchedCount === 0, "Same gender pairs should NOT match");
  console.log("✓ Test 2: Same gender rejection passed");
}

// Test 3: Competition / Greedy choice
// Male 1 picks Female 1 (rank 1) and Female 2 (rank 2)
// Male 2 picks Female 1 (rank 1)
// Female 1 picks Male 1 (rank 1) and Male 2 (rank 1)
// Female 2 picks Male 1 (rank 1)
//
// Pair (Male 1, Female 1): strength = 1 + 1 = 2
// Pair (Male 2, Female 1): strength = 1 + 1 = 2
// Pair (Male 1, Female 2): strength = 2 + 1 = 3
//
// Since Male 1 has earlier signup time than Male 2, Male 1 gets Female 1.
// Male 2 is left unmatched. Female 2 is left unmatched. No double match.
{
  const m1: FrozenParticipant = {
    userId: "m1",
    gender: "MALE",
    signupTime: new Date("2026-09-01T10:00:00Z"),
    status: "ACTIVE",
  };
  const m2: FrozenParticipant = {
    userId: "m2",
    gender: "MALE",
    signupTime: new Date("2026-09-01T11:00:00Z"),
    status: "ACTIVE",
  };
  const f1: FrozenParticipant = {
    userId: "f1",
    gender: "FEMALE",
    signupTime: new Date("2026-09-01T10:30:00Z"),
    status: "ACTIVE",
  };
  const f2: FrozenParticipant = {
    userId: "f2",
    gender: "FEMALE",
    signupTime: new Date("2026-09-01T10:45:00Z"),
    status: "ACTIVE",
  };

  const choices: FrozenChoice[] = [
    { pickerId: "m1", pickedId: "f1", rank: 1 },
    { pickerId: "m1", pickedId: "f2", rank: 2 },
    { pickerId: "m2", pickedId: "f1", rank: 1 },
    { pickerId: "f1", pickedId: "m1", rank: 1 },
    { pickerId: "f1", pickedId: "m2", rank: 1 },
    { pickerId: "f2", pickedId: "m1", rank: 1 },
  ];

  const input: MatchingInput = { participants: [m1, m2, f1, f2], choices };
  const result = runMatchingEngine(input);
  const validation = validateMatchingResult(result, input);

  assert(validation.valid, `Validation failed: ${validation.violations.join(", ")}`);
  assert(result.matchedCount === 1, "Only 1 match should occur");
  assert(
    (result.matches[0].user1Id === "f1" && result.matches[0].user2Id === "m1") ||
    (result.matches[0].user1Id === "m1" && result.matches[0].user2Id === "f1"),
    "m1 and f1 should be matched"
  );
  assert(result.unmatchedMutualPairs === 2, "2 mutual pairs remain unmatched due to competition");
  console.log("✓ Test 3: Competition / Greedy tie-breaking passed");
}

// Test 4: Determinism on shuffled inputs
{
  const participants: FrozenParticipant[] = [
    { userId: "m1", gender: "MALE", signupTime: new Date("2026-09-01T10:00:00Z"), status: "ACTIVE" },
    { userId: "m2", gender: "MALE", signupTime: new Date("2026-09-01T10:10:00Z"), status: "ACTIVE" },
    { userId: "f1", gender: "FEMALE", signupTime: new Date("2026-09-01T10:05:00Z"), status: "ACTIVE" },
    { userId: "f2", gender: "FEMALE", signupTime: new Date("2026-09-01T10:15:00Z"), status: "ACTIVE" },
  ];

  const choices: FrozenChoice[] = [
    { pickerId: "m1", pickedId: "f1", rank: 1 },
    { pickerId: "f1", pickedId: "m1", rank: 2 },
    { pickerId: "m2", pickedId: "f2", rank: 1 },
    { pickerId: "f2", pickedId: "m2", rank: 1 },
  ];

  const res1 = runMatchingEngine({ participants, choices });
  
  // Shuffle choices
  const shuffledChoices = [...choices].reverse();
  const res2 = runMatchingEngine({ participants, choices: shuffledChoices });

  assert(res1.matchedCount === res2.matchedCount, "Match counts must be identical");
  assert(JSON.stringify(res1.matches) === JSON.stringify(res2.matches), "Matches must be exactly identical regardless of choice order");
  console.log("✓ Test 4: Determinism test passed");
}

console.log("--- All Matching Engine Tests Passed Successfully! ---");
