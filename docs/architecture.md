# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each route component responsible for its capability's presentation and use the shared API client for relative `/api` requests. Each view must expose loading, meaningful empty, and accessible error states without moving business rules into the UI.
- Logic tier decision: Keep Express routes as thin request/response adapters. Put input validation, reference lookups, point calculation, leaderboard aggregation, and recommendation selection in `octofitService.ts`; return deliberate 4xx errors for invalid input, invalid IDs, missing references, or unknown users.
- Data tier decision: Use required Mongoose validators for user identity and fitness goal, team name and mascot, activity references/type/minutes/points/date, and workout focus/minutes/difficulty. Give team members an empty-array default. Keep seed upserts idempotent and non-destructive, preserving unrelated records and keeping user/team membership links consistent.
- Activity tracking approach: Validate the request fields and ObjectId syntax before querying, then confirm the user and team exist. Store their references, the submitted type and minutes, a server-generated occurrence date, and computed points at one point per minute, matching the existing seed fixtures.
- Team management approach: Reject a missing or blank name with `400`; preserve name and mascot on create/list, default omitted members to an empty array, and validate supplied member references before saving.
- Leaderboard approach: Sum activity points per team, sort by total points descending, and return `teamName`, `totalPoints`, and a 1-based `rank` for each result.
- Workout suggestions approach: Find the user by email, consider their fitness goal and recent activity, and put a matching workout first with a human-readable reason. Return a deliberate 4xx response when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Baseline before implementation: `npm test --prefix octofit-tracker/backend` reports 8 failed and 1 passed (the seed test passes; schema validation and API behavior fail). `npm test --prefix octofit-tracker/frontend` reports 15 failed because the capability views still show “Implementation pending.”
- 1. Data tier: `npm run test:data --prefix octofit-tracker/backend` checks model validation/defaults and repeatable, non-destructive seeding. Fix these failures before relying on API behavior.
- 2. Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks activity and team creation/listing, deliberate 4xx validation, point/date computation, leaderboard totals/ranks, and user-specific workout suggestions. Failures here indicate route/service behavior or its data contract is incomplete.
- 3. Presentation tier: `npm test --prefix octofit-tracker/frontend` checks API-backed content, user-specific suggestion requests, and accessible loading, empty, and error states. Run after the API contract passes.
- 4. Final build gates: `npm run build --prefix octofit-tracker/backend` and `npm run build --prefix octofit-tracker/frontend` check TypeScript and production bundling after the focused suites pass.
