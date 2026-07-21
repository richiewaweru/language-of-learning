# Learner Validation Protocol — V4

**Status:** PENDING-HUMAN

## Purpose

Verify that the audience experience communicates value to learners who know basic Python but have not worked on this repository.

## Success threshold

At least **4 of 5** learners must:

1. Explain the accumulate pattern in plain language
2. Identify the changing state
3. Predict a subsequent update
4. Recognize the pattern in renamed code

Do not weaken this threshold after testing.

## Protocol (per learner)

### Pre-test

Ask the learner to explain the accumulate example using code alone. Record:

- What they understand
- What they misunderstand
- Whether they can predict intermediate totals
- Whether they recognize the pattern

### Product test

Allow use of `/demo` and accumulate lesson **without coaching**. Observe:

- Where they hesitate
- What they click first
- Whether controls are understood
- Whether motion helps
- Whether captions match visuals
- Whether any visual element distracts

### Post-test

Ask the learner to:

1. Explain how the result was built
2. Identify the remembered state
3. Predict the next state in a new example
4. Recognize accumulate in renamed code
5. Explain one difference between accumulate and count

## Teacher / explainer review

Run at least one session with a teacher, tutor, or experienced programmer. Record additional context needed. Do not build a teacher dashboard in response.

## Sign-off

| Item | Status |
|------|--------|
| Five-person learner protocol | PENDING-HUMAN |
| Teacher/explainer review | PENDING-HUMAN |
| Richie lesson sign-off | PENDING-HUMAN |
| PM7 A/B sign-off | PENDING-HUMAN |

## gate-V4

gate-V4 passes only when human thresholds are met AND no P0/P1 technical defects remain.
