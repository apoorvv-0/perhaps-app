/**
 * Matching Engine
 *
 * Pure, deterministic, greedy mutual-matching algorithm.
 * No side effects — call runMatchingEngine() with a frozen snapshot.
 * Persist the result separately.
 *
 * See: Build Spec §4 — Matching Algorithm Exact Spec
 */

// ─────────────────────────────────────────────
// Input Types (frozen snapshot)
// ─────────────────────────────────────────────

export interface FrozenParticipant {
  userId: string;
  gender: "MALE" | "FEMALE";
  signupTime: Date;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
}

export interface FrozenChoice {
  pickerId: string;
  pickedId: string;
  rank: number; // 1 = most wanted
}

export interface MatchingInput {
  participants: FrozenParticipant[];
  choices: FrozenChoice[];
}

// ─────────────────────────────────────────────
// Output Types
// ─────────────────────────────────────────────

export interface EngineMatch {
  user1Id: string; // canonically lower UUID
  user2Id: string;
  matchStrength: number; // rank(A→B) + rank(B→A)
  rankUser1ToUser2: number;
  rankUser2ToUser1: number;
}

export interface MatchingResult {
  matches: EngineMatch[];
  matchedCount: number;
  unmatchedMutualPairs: number; // mutual pairs that existed but couldn't be matched
  totalMutualPairs: number;
}

// ─────────────────────────────────────────────
// Internal Candidate Pair
// ─────────────────────────────────────────────

interface CandidatePair {
  userAId: string;
  userBId: string;
  rankAtoB: number;
  rankBtoA: number;
  strength: number;       // rankAtoB + rankBtoA
  worseRank: number;      // max(rankAtoB, rankBtoA)
  earlierSignup: Date;    // min(signupA, signupB)
  laterSignup: Date;      // max(signupA, signupB)
  canonicalLowerId: string;
}

// ─────────────────────────────────────────────
// Main Engine
// ─────────────────────────────────────────────

export function runMatchingEngine(input: MatchingInput): MatchingResult {
  const { participants, choices } = input;

  // Build quick lookup maps
  const participantMap = new Map<string, FrozenParticipant>(
    participants.map((p) => [p.userId, p])
  );

  const choiceMap = new Map<string, Map<string, number>>();
  for (const c of choices) {
    if (!choiceMap.has(c.pickerId)) {
      choiceMap.set(c.pickerId, new Map());
    }
    choiceMap.get(c.pickerId)!.set(c.pickedId, c.rank);
  }

  // ── Step 1: Find eligible mutual pairs ───
  const candidatePairs: CandidatePair[] = [];
  const seenPairs = new Set<string>();

  for (const [pickerId, picks] of choiceMap) {
    const pickerParticipant = participantMap.get(pickerId);
    if (!pickerParticipant || pickerParticipant.status !== "ACTIVE") continue;

    for (const [pickedId, rankAtoB] of picks) {
      // Canonical pair key to avoid duplicates
      const pairKey = [pickerId, pickedId].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const pickedParticipant = participantMap.get(pickedId);
      if (!pickedParticipant || pickedParticipant.status !== "ACTIVE") continue;

      // Cross-gender only (Decision #13)
      if (pickerParticipant.gender === pickedParticipant.gender) continue;

      // Must be mutual
      const rankBtoA = choiceMap.get(pickedId)?.get(pickerId);
      if (rankBtoA === undefined) continue;

      const signupA = pickerParticipant.signupTime;
      const signupB = pickedParticipant.signupTime;

      candidatePairs.push({
        userAId: pickerId,
        userBId: pickedId,
        rankAtoB,
        rankBtoA,
        strength: rankAtoB + rankBtoA,
        worseRank: Math.max(rankAtoB, rankBtoA),
        earlierSignup: signupA < signupB ? signupA : signupB,
        laterSignup: signupA > signupB ? signupA : signupB,
        canonicalLowerId: pickerId < pickedId ? pickerId : pickedId,
      });
    }
  }

  const totalMutualPairs = candidatePairs.length;

  // ── Step 2: Sort pairs (deterministic) ───
  // Sort by: strength → worseRank → earlierSignup → laterSignup → canonicalLowerId
  candidatePairs.sort((a, b) => {
    if (a.strength !== b.strength) return a.strength - b.strength;
    if (a.worseRank !== b.worseRank) return a.worseRank - b.worseRank;
    const earlierDiff = a.earlierSignup.getTime() - b.earlierSignup.getTime();
    if (earlierDiff !== 0) return earlierDiff;
    const laterDiff = a.laterSignup.getTime() - b.laterSignup.getTime();
    if (laterDiff !== 0) return laterDiff;
    return a.canonicalLowerId < b.canonicalLowerId ? -1 : 1;
  });

  // ── Step 3: Greedy walk ───────────────────
  const matched = new Set<string>();
  const matches: EngineMatch[] = [];

  for (const pair of candidatePairs) {
    if (matched.has(pair.userAId) || matched.has(pair.userBId)) continue;

    matched.add(pair.userAId);
    matched.add(pair.userBId);

    const user1Id = pair.userAId < pair.userBId ? pair.userAId : pair.userBId;
    const user2Id = pair.userAId < pair.userBId ? pair.userBId : pair.userAId;

    matches.push({
      user1Id,
      user2Id,
      matchStrength: pair.strength,
      rankUser1ToUser2: user1Id === pair.userAId ? pair.rankAtoB : pair.rankBtoA,
      rankUser2ToUser1: user1Id === pair.userAId ? pair.rankBtoA : pair.rankAtoB,
    });
  }

  const unmatchedMutualPairs = totalMutualPairs - matches.length;

  return {
    matches,
    matchedCount: matches.length,
    unmatchedMutualPairs,
    totalMutualPairs,
  };
}

// ─────────────────────────────────────────────
// Validation: Properties the algorithm must hold
// (for testing)
// ─────────────────────────────────────────────

export function validateMatchingResult(
  result: MatchingResult,
  input: MatchingInput
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const usedUsers = new Set<string>();

  for (const match of result.matches) {
    // No person in two matches
    if (usedUsers.has(match.user1Id)) {
      violations.push(`User ${match.user1Id} appears in multiple matches`);
    }
    if (usedUsers.has(match.user2Id)) {
      violations.push(`User ${match.user2Id} appears in multiple matches`);
    }
    usedUsers.add(match.user1Id);
    usedUsers.add(match.user2Id);

    // user1Id < user2Id (canonical ordering)
    if (match.user1Id >= match.user2Id) {
      violations.push(
        `Match (${match.user1Id}, ${match.user2Id}) violates canonical ordering`
      );
    }

    // Both must be active participants
    const p1 = input.participants.find((p) => p.userId === match.user1Id);
    const p2 = input.participants.find((p) => p.userId === match.user2Id);
    if (!p1 || p1.status !== "ACTIVE")
      violations.push(`Matched user ${match.user1Id} is not active`);
    if (!p2 || p2.status !== "ACTIVE")
      violations.push(`Matched user ${match.user2Id} is not active`);

    // Cross-gender
    if (p1 && p2 && p1.gender === p2.gender) {
      violations.push(
        `Same-gender match: ${match.user1Id} and ${match.user2Id} are both ${p1.gender}`
      );
    }
  }

  return { valid: violations.length === 0, violations };
}
