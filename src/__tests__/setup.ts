import { vi } from "vitest";

/**
 * Global test setup for Phase 2 tests.
 * Provides mock helpers for Drizzle ORM transactions and tRPC context.
 */

/** Creates a mock Drizzle transaction with chainable query builder methods. */
export function createMockTx() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  };
}

/** Creates a mock tRPC context with optional overrides. */
export function createMockCtx(
  overrides?: Partial<{ userId: string; role: string }>
) {
  return {
    session: { user: { id: overrides?.userId ?? "test-user-id" } },
    db: createMockTx(),
    ...overrides,
  };
}

// Mock R2 storage module
vi.mock("@/server/storage", () => ({
  uploadToR2: vi.fn().mockResolvedValue({ key: "mock-key", url: "https://mock.r2.dev/mock-key" }),
  getSignedUrl: vi.fn().mockResolvedValue("https://mock.r2.dev/signed/mock-key"),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
}));
