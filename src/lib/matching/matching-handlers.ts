/**
 * POST /api/admin/matching/dry-run
 * POST /api/admin/matching/commit
 *
 * Manual matching trigger — Super Admin only.
 * Dry-run returns aggregate counts only, no names (Decision #6).
 * Commit persists an immutable versioned snapshot.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { runMatchingEngine, validateMatchingResult } from "@/lib/matching/engine";
import { createAuditLog } from "@/lib/audit";
import type { FrozenParticipant, FrozenChoice } from "@/lib/matching/engine";

// ─────────────────────────────────────────────
// Shared: Build frozen snapshot from DB
// ─────────────────────────────────────────────

async function buildFrozenSnapshot(eventId: string) {
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  const participants: FrozenParticipant[] = registrations
    .filter((r) => r.user.profile && r.user.status !== "DELETED")
    .map((r) => ({
      userId: r.userId,
      gender: r.user.profile!.gender,
      signupTime: r.user.profile!.signupTime,
      status: r.user.status as "ACTIVE" | "SUSPENDED" | "DELETED",
    }));

  const choices = await prisma.choice.findMany({
    where: { eventId },
    select: { pickerId: true, pickedId: true, rank: true },
  });

  const frozenChoices: FrozenChoice[] = choices.map((c) => ({
    pickerId: c.pickerId,
    pickedId: c.pickedId,
    rank: c.rank,
  }));

  return { participants, choices: frozenChoices };
}

// ─────────────────────────────────────────────
// POST /api/admin/matching/dry-run
// ─────────────────────────────────────────────

export async function POST_DRY_RUN(request: NextRequest) {
  const session = await getSession();
  if (!session || !(session.globalRole === "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_CLOSED") {
    return NextResponse.json(
      { error: "Matching can only run after Choosing is closed." },
      { status: 400 }
    );
  }

  const snapshot = await buildFrozenSnapshot(event.id);
  const result = runMatchingEngine(snapshot);

  await createAuditLog({
    adminId: session.userId,
    action: "MATCHING_DRY_RUN",
    eventId: event.id,
    metadata: {
      matchedCount: result.matchedCount,
      unmatchedMutualPairs: result.unmatchedMutualPairs,
      totalMutualPairs: result.totalMutualPairs,
    },
  });

  // Return aggregate counts only — no names, no IDs (Decision #6)
  return NextResponse.json({
    dryRun: true,
    matchedCount: result.matchedCount,
    unmatchedMutualPairs: result.unmatchedMutualPairs,
    totalMutualPairs: result.totalMutualPairs,
    totalParticipants: snapshot.participants.length,
  });
}

// ─────────────────────────────────────────────
// POST /api/admin/matching/commit
// ─────────────────────────────────────────────

export async function POST_COMMIT(request: NextRequest) {
  const session = await getSession();
  if (!session || !(session.globalRole === "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Require typed confirmation (Decision §8)
  const { confirmation } = body as { confirmation?: string };
  if (confirmation !== "COMMIT MATCHING") {
    return NextResponse.json(
      {
        error:
          'Type exactly "COMMIT MATCHING" in the confirmation field to proceed.',
      },
      { status: 400 }
    );
  }

  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_CLOSED") {
    return NextResponse.json(
      { error: "Matching can only run after Choosing is closed." },
      { status: 400 }
    );
  }

  // Check no existing committed (non-dry-run) matching
  const existingCommit = await prisma.matchingExecution.findFirst({
    where: { eventId: event.id, isDryRun: false },
  });
  if (existingCommit) {
    return NextResponse.json(
      {
        error:
          "Matching has already been committed for this event. Re-run requires Super Admin emergency override.",
      },
      { status: 409 }
    );
  }

  // ── Build snapshot & run engine ──────────
  const snapshot = await buildFrozenSnapshot(event.id);
  const result = runMatchingEngine(snapshot);

  // ── Validate result integrity ────────────
  const validation = validateMatchingResult(result, snapshot);
  if (!validation.valid) {
    console.error("[Matching] Validation failed:", validation.violations);
    return NextResponse.json(
      { error: "Matching validation failed. Please contact engineering." },
      { status: 500 }
    );
  }

  // ── Get next version number ──────────────
  const lastExecution = await prisma.matchingExecution.findFirst({
    where: { eventId: event.id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (lastExecution?.version ?? 0) + 1;

  // ── Persist atomically ───────────────────
  await prisma.$transaction(async (tx) => {
    // Create the execution record
    await tx.matchingExecution.create({
      data: {
        eventId: event.id,
        version: nextVersion,
        executedById: session.userId,
        matchedCount: result.matchedCount,
        unmatchedCount: result.unmatchedMutualPairs,
        totalPairs: result.totalMutualPairs,
        isDryRun: false,
      },
    });

    // Persist all matches
    if (result.matches.length > 0) {
      await tx.match.createMany({
        data: result.matches.map((m) => ({
          eventId: event.id,
          user1Id: m.user1Id,
          user2Id: m.user2Id,
          matchStrength: m.matchStrength,
        })),
      });
    }

    // Advance event to MATCHING phase
    await tx.event.update({
      where: { id: event.id },
      data: { status: "MATCHING" },
    });
  });

  await createAuditLog({
    adminId: session.userId,
    action: "MATCHING_COMMITTED",
    eventId: event.id,
    metadata: {
      version: nextVersion,
      matchedCount: result.matchedCount,
      unmatchedMutualPairs: result.unmatchedMutualPairs,
      totalMutualPairs: result.totalMutualPairs,
    },
  });

  return NextResponse.json({
    ok: true,
    version: nextVersion,
    matchedCount: result.matchedCount,
    unmatchedMutualPairs: result.unmatchedMutualPairs,
    totalMutualPairs: result.totalMutualPairs,
  });
}
