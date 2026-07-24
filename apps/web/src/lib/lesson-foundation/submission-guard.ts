export type SubmissionToken = {
  submissionId: string;
  attemptId: string;
};

export type SubmissionIdentity = SubmissionToken & {
  sourceHash: string;
  lensRevision: number;
};

export function createSubmissionGuard(
  createId: () => string = () => crypto.randomUUID(),
) {
  let activeSubmissionId: string | null = null;

  return {
    begin(attemptId: string): SubmissionToken {
      const submissionId = createId();
      activeSubmissionId = submissionId;
      return { submissionId, attemptId };
    },
    bind(
      token: SubmissionToken,
      sourceHash: string,
      lensRevision: number,
    ): SubmissionIdentity | null {
      if (activeSubmissionId !== token.submissionId) return null;
      return { ...token, sourceHash, lensRevision };
    },
    isActive(token: SubmissionToken): boolean {
      return activeSubmissionId === token.submissionId;
    },
    isCurrent(
      identity: SubmissionIdentity,
      current: SubmissionIdentity,
    ): boolean {
      return activeSubmissionId === identity.submissionId
        && identity.submissionId === current.submissionId
        && identity.attemptId === current.attemptId
        && identity.sourceHash === current.sourceHash
        && identity.lensRevision === current.lensRevision;
    },
    invalidate(): void {
      activeSubmissionId = null;
    },
  };
}
