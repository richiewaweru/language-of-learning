/**
 * Tracks the most recently started analysis. A completion may update session
 * state only while its generation remains current.
 */
export function createRunCoordinator() {
  let generation = 0;
  return {
    begin(): number {
      generation += 1;
      return generation;
    },
    invalidate(): void {
      generation += 1;
    },
    isCurrent(candidate: number): boolean {
      return candidate === generation;
    },
  };
}
