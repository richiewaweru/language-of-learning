# AI Integration Specification

## Architecture
source + args → server verification → graph/trace → SemanticScene → TeachingContext → provider-neutral gateway → configured provider → validated TeachingResponse → Ask Lens

## Providers
- mock
- deepseek
- openai
- anthropic
- openai_compatible

No learner component branches on provider.

## Root environment
```env
AI_ENABLED=true
AI_PROVIDER=deepseek
AI_API_STYLE=openai_chat
AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=
AI_TIMEOUT_SECONDS=30
AI_MAX_OUTPUT_TOKENS=900
AI_TEMPERATURE=0.2
AI_STREAMING=false
AI_THINKING_ENABLED=false
AI_REASONING_EFFORT=medium
AI_MAX_RETRIES=1
AI_ENABLE_EXPLAIN_STEP=true
AI_ENABLE_EXPLAIN_PROGRAM=true
AI_ENABLE_CHAT=true
AI_ENABLE_FALLBACK=true
AI_STRUCTURED_OUTPUT=true
```

## Endpoints
- `GET /ai/status`
- `POST /ai/explain-step`
- `POST /ai/explain-program`
- `POST /ai/chat`

## TeachingContext includes
Source, args, learner level, lesson goal, detected pattern, support status, current step, active source, active event, active entities, current and previous values, visual vocabulary, and relevant recent events.

## First features
- Explain current step.
- Explain whole process.
- Ask scoped questions.

## Required fallback templates
Bind, read, select, compare, branch, update, repeat, call, return, effect, unsupported.

## Security
Keys never reach browser or logs. AI endpoints never trust browser-supplied graph or trace. Provider errors degrade safely.
