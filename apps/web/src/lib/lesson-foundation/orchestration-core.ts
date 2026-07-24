export class CueTransitionGuard {
  private generation = 0;

  begin() {
    this.generation += 1;
    return this.generation;
  }

  isCurrent(candidate: number) {
    return candidate === this.generation;
  }
}

export class InitializeOnceLedger {
  private readonly applied = new Set<string>();

  shouldApply(cueId: string) {
    if (this.applied.has(cueId)) return false;
    this.applied.add(cueId);
    return true;
  }
}
