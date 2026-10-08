"use strict";
/**
 * Matching Engine
 *
 * Pure, deterministic, greedy mutual-matching algorithm.
 * No side effects — call runMatchingEngine() with a frozen snapshot.
 * Persist the result separately.
 *
 * See: Build Spec §4 — Matching Algorithm Exact Spec
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMatchingEngine = runMatchingEngine;
exports.validateMatchingResult = validateMatchingResult;
// ─────────────────────────────────────────────
// Main Engine
// ─────────────────────────────────────────────
function runMatchingEngine(input) {
    var _a;
    var participants = input.participants, choices = input.choices;
    // Build quick lookup maps
    var participantMap = new Map(participants.map(function (p) { return [p.userId, p]; }));
    var choiceMap = new Map();
    for (var _i = 0, choices_1 = choices; _i < choices_1.length; _i++) {
        var c = choices_1[_i];
        if (!choiceMap.has(c.pickerId)) {
            choiceMap.set(c.pickerId, new Map());
        }
        choiceMap.get(c.pickerId).set(c.pickedId, c.rank);
    }
    // ── Step 1: Find eligible mutual pairs ───
    var candidatePairs = [];
    var seenPairs = new Set();
    for (var _b = 0, choiceMap_1 = choiceMap; _b < choiceMap_1.length; _b++) {
        var _c = choiceMap_1[_b], pickerId = _c[0], picks = _c[1];
        var pickerParticipant = participantMap.get(pickerId);
        if (!pickerParticipant || pickerParticipant.status !== "ACTIVE")
            continue;
        for (var _d = 0, picks_1 = picks; _d < picks_1.length; _d++) {
            var _e = picks_1[_d], pickedId = _e[0], rankAtoB = _e[1];
            // Canonical pair key to avoid duplicates
            var pairKey = [pickerId, pickedId].sort().join("|");
            if (seenPairs.has(pairKey))
                continue;
            seenPairs.add(pairKey);
            var pickedParticipant = participantMap.get(pickedId);
            if (!pickedParticipant || pickedParticipant.status !== "ACTIVE")
                continue;
            // Cross-gender only (Decision #13)
            if (pickerParticipant.gender === pickedParticipant.gender)
                continue;
            // Must be mutual
            var rankBtoA = (_a = choiceMap.get(pickedId)) === null || _a === void 0 ? void 0 : _a.get(pickerId);
            if (rankBtoA === undefined)
                continue;
            var signupA = pickerParticipant.signupTime;
            var signupB = pickedParticipant.signupTime;
            candidatePairs.push({
                userAId: pickerId,
                userBId: pickedId,
                rankAtoB: rankAtoB,
                rankBtoA: rankBtoA,
                strength: rankAtoB + rankBtoA,
                worseRank: Math.max(rankAtoB, rankBtoA),
                earlierSignup: signupA < signupB ? signupA : signupB,
                laterSignup: signupA > signupB ? signupA : signupB,
                canonicalLowerId: pickerId < pickedId ? pickerId : pickedId,
            });
        }
    }
    var totalMutualPairs = candidatePairs.length;
    // ── Step 2: Sort pairs (deterministic) ───
    // Sort by: strength → worseRank → earlierSignup → laterSignup → canonicalLowerId
    candidatePairs.sort(function (a, b) {
        if (a.strength !== b.strength)
            return a.strength - b.strength;
        if (a.worseRank !== b.worseRank)
            return a.worseRank - b.worseRank;
        var earlierDiff = a.earlierSignup.getTime() - b.earlierSignup.getTime();
        if (earlierDiff !== 0)
            return earlierDiff;
        var laterDiff = a.laterSignup.getTime() - b.laterSignup.getTime();
        if (laterDiff !== 0)
            return laterDiff;
        return a.canonicalLowerId < b.canonicalLowerId ? -1 : 1;
    });
    // ── Step 3: Greedy walk ───────────────────
    var matched = new Set();
    var matches = [];
    for (var _f = 0, candidatePairs_1 = candidatePairs; _f < candidatePairs_1.length; _f++) {
        var pair = candidatePairs_1[_f];
        if (matched.has(pair.userAId) || matched.has(pair.userBId))
            continue;
        matched.add(pair.userAId);
        matched.add(pair.userBId);
        var user1Id = pair.userAId < pair.userBId ? pair.userAId : pair.userBId;
        var user2Id = pair.userAId < pair.userBId ? pair.userBId : pair.userAId;
        matches.push({
            user1Id: user1Id,
            user2Id: user2Id,
            matchStrength: pair.strength,
            rankUser1ToUser2: user1Id === pair.userAId ? pair.rankAtoB : pair.rankBtoA,
            rankUser2ToUser1: user1Id === pair.userAId ? pair.rankBtoA : pair.rankAtoB,
        });
    }
    var unmatchedMutualPairs = totalMutualPairs - matches.length;
    return {
        matches: matches,
        matchedCount: matches.length,
        unmatchedMutualPairs: unmatchedMutualPairs,
        totalMutualPairs: totalMutualPairs,
    };
}
// ─────────────────────────────────────────────
// Validation: Properties the algorithm must hold
// (for testing)
// ─────────────────────────────────────────────
function validateMatchingResult(result, input) {
    var violations = [];
    var usedUsers = new Set();
    var _loop_1 = function (match) {
        // No person in two matches
        if (usedUsers.has(match.user1Id)) {
            violations.push("User ".concat(match.user1Id, " appears in multiple matches"));
        }
        if (usedUsers.has(match.user2Id)) {
            violations.push("User ".concat(match.user2Id, " appears in multiple matches"));
        }
        usedUsers.add(match.user1Id);
        usedUsers.add(match.user2Id);
        // user1Id < user2Id (canonical ordering)
        if (match.user1Id >= match.user2Id) {
            violations.push("Match (".concat(match.user1Id, ", ").concat(match.user2Id, ") violates canonical ordering"));
        }
        // Both must be active participants
        var p1 = input.participants.find(function (p) { return p.userId === match.user1Id; });
        var p2 = input.participants.find(function (p) { return p.userId === match.user2Id; });
        if (!p1 || p1.status !== "ACTIVE")
            violations.push("Matched user ".concat(match.user1Id, " is not active"));
        if (!p2 || p2.status !== "ACTIVE")
            violations.push("Matched user ".concat(match.user2Id, " is not active"));
        // Cross-gender
        if (p1 && p2 && p1.gender === p2.gender) {
            violations.push("Same-gender match: ".concat(match.user1Id, " and ").concat(match.user2Id, " are both ").concat(p1.gender));
        }
    };
    for (var _i = 0, _a = result.matches; _i < _a.length; _i++) {
        var match = _a[_i];
        _loop_1(match);
    }
    return { valid: violations.length === 0, violations: violations };
}
