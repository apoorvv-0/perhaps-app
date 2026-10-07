/**
 * Event Service
 *
 * Manages the Perhaps event phase state machine.
 * Time-based transitions (REGISTRATION → CHOOSING) run via cron.
 * Manual transitions (MATCHING, RESULTS_OPEN) are admin-only API actions.
 */

import { prisma } from "@/lib/db/prisma";
import { EventPhase, Event } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

// ─────────────────────────────────────────────
// Allowed Automatic Transitions
// ─────────────────────────────────────────────

const AUTO_TRANSITIONS: Partial<Record<EventPhase, EventPhase>> = {
  REGISTRATION_OPEN: "REGISTRATION_CLOSED",
  CHOOSING_OPEN: "CHOOSING_CLOSED",
};

// ─────────────────────────────────────────────
// Phase Transition Rules
// ─────────────────────────────────────────────

export const VALID_NEXT_PHASES: Record<EventPhase, EventPhase[]> = {
  DRAFT:               ["REGISTRATION_OPEN"],
  REGISTRATION_OPEN:   ["REGISTRATION_CLOSED"],
  REGISTRATION_CLOSED: ["CHOOSING_OPEN", "REGISTRATION_OPEN", "DRAFT"],
  CHOOSING_OPEN:       ["CHOOSING_CLOSED"],
  CHOOSING_CLOSED:     ["MATCHING", "CHOOSING_OPEN"],
  MATCHING:            ["RESULTS_OPEN", "CHOOSING_CLOSED"],
  RESULTS_OPEN:        ["CLOSED", "MATCHING"],
  CLOSED:              ["ARCHIVED", "RESULTS_OPEN"],
  ARCHIVED:            [],
};

// ─────────────────────────────────────────────
// Cron: Check and auto-transition phases
// Called by /api/cron/phase-check (Vercel Cron)
// ─────────────────────────────────────────────

export async function runPhaseTransitionCheck(): Promise<void> {
  const now = new Date();

  // Check REGISTRATION_OPEN → REGISTRATION_CLOSED
  const regCloseEvents = await prisma.event.findMany({
    where: {
      status: "REGISTRATION_OPEN",
      registrationEndAt: { lte: now },
    },
  });

  for (const event of regCloseEvents) {
    await transitionPhase(event, "REGISTRATION_CLOSED", "system-cron");
  }

  // Check CHOOSING_OPEN → CHOOSING_CLOSED
  const choiceCloseEvents = await prisma.event.findMany({
    where: {
      status: "CHOOSING_OPEN",
      choosingEndAt: { lte: now },
    },
  });

  for (const event of choiceCloseEvents) {
    await transitionPhase(event, "CHOOSING_CLOSED", "system-cron");
  }

  // Check RESULTS_OPEN → CLOSED
  const resultsCloseEvents = await prisma.event.findMany({
    where: {
      status: "RESULTS_OPEN",
      resultsEndAt: { lte: now },
    },
  });

  for (const event of resultsCloseEvents) {
    await transitionPhase(event, "CLOSED", "system-cron");
  }
}

// ─────────────────────────────────────────────
// Transition a single event
// ─────────────────────────────────────────────

async function transitionPhase(
  event: Event,
  targetPhase: EventPhase,
  adminId: string
): Promise<void> {
  await prisma.event.update({
    where: { id: event.id },
    data: { status: targetPhase },
  });

  if (adminId !== "system-cron") {
    await createAuditLog({
      adminId,
      action: "EVENT_PHASE_CHANGED",
      eventId: event.id,
      metadata: { from: event.status, to: targetPhase },
    });
  }
}

// ─────────────────────────────────────────────
// For backwards compatibility during single-event launch, just get the most recent non-archived event
export async function getActiveEvent(): Promise<Event | null> {
  return prisma.event.findFirst({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────
// Population Minimum Check (Decision #14)
// Called at REGISTRATION_CLOSED
// ─────────────────────────────────────────────

export interface PopulationCheckResult {
  passed: boolean;
  totalParticipants: number;
  maleCount: number;
  femaleCount: number;
  minimumTotal: number;
  minimumPerGender: number;
}

export async function checkPopulationMinimum(
  eventId: string
): Promise<PopulationCheckResult> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: { user: true },
  });

  const active = registrations.filter(
    (r) => r.user.status === "ACTIVE"
  );
  const maleCount = active.filter((r) => r.user.gender === "MALE").length;
  const femaleCount = active.filter((r) => r.user.gender === "FEMALE").length;
  const totalParticipants = active.length;

  const passed =
    totalParticipants >= event.minimumParticipants &&
    maleCount >= event.minimumPerGender &&
    femaleCount >= event.minimumPerGender;

  return {
    passed,
    totalParticipants,
    maleCount,
    femaleCount,
    minimumTotal: event.minimumParticipants,
    minimumPerGender: event.minimumPerGender,
  };
}
