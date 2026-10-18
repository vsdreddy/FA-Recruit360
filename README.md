# FA Recruit360

React + TypeScript recreation of the supplied dashboard and candidate overview references, using local mock data.

## Run

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173; the current session runs on port 5174). Build with `npm run build`.

## Pages and interactions

- `/`: dashboard with reporting periods, interactive charts, exceptions, search/filter/selection in the new hires table.
- `/candidates/001234`: reference candidate overview, onboarding timeline, seven tabs, documents, tasks, dependencies, contacts, and candidate editing.
- `/candidates`, `/hires`, `/tasks`, `/documents`, `/exceptions`, `/process`, `/admin`: supporting mock workspace pages.
- Global candidate search, candidate creation, local task completion, document review/download, risk resolution, notification settings, and mock uploads.
- Candidate edits, new candidates, task completion, risk resolutions, and preferences use browser localStorage. There is no backend, and no messages or real payments are sent.

Dates and metrics intentionally reproduce the 2024–2025 demonstration data in the references. The candidate portrait uses a CSS window into the unmodified user-provided images. The logo is recreated in text; fonts and icons are close approximations. Document downloads are clearly labeled mock text documents; uploads store metadata locally.

## Verification

`npm test` runs browser and fixture checks covering dashboard reconciliation, candidate filters, documents, tasks, workflow gates, configuration versions, persistence, and responsive layouts. The local test configuration targets port 5174 and installed Microsoft Edge. Screenshots are written to `artifacts/`.

## Configurable workflow prototype

- Open a candidate and click a process stage to open its checklist drawer. Record an evidence note before completing a mock task, reviewing a mock document, or simulating an approval. Required evidence and dependencies gate **Complete Stage & Continue**.
- Try Sarah Mitchell (`/candidates/001235`): Contract requires both signatures and the executed agreement. Completing one task never advances the candidate automatically.
- Equipment preparation can run in parallel. A candidate retains one primary stage for grid counts. Access completion depends on Hire Processing and registration clearance; Ready to Start depends on all preceding enabled stages. Mark Started is a separate final action.
- Workflow requirements share evidence with Tasks and Workflow Documents. Existing supporting files remain in their separate attachment library. Simulated document evidence does not upload or transmit a real file.
- Initial records retain the photographed reporting snapshot. Historical completed stages are explicitly seeded and labeled as imported mock evidence. The first workflow evidence change activates weighted readiness and replaces that candidate's legacy summary tasks with detailed workflow tasks. Legacy local data remains stored until Reset Demo Data.
- Reopening requires a reason, clears evidence for the stage and its dependent stages, and preserves the audit history. Readiness, primary stage, and completion indicators are recalculated.
- Administration contains Workflow Configuration: stage labels/order/enabled state, owners, dependencies, due-date offsets, required tasks/documents/approvals, readiness weights, and division-specific templates. Save Draft persists unfinished configuration; Publish Version creates an immutable version used by new matching candidates. Existing candidates stay pinned until explicit migration with a reason; migration resets evidence for revalidation.
- Reset Demo Data requires confirmation and clears this prototype's local records. All data is browser-local; approvals, signatures, submissions, employee setup, and access are simulations. There is no live HR, FINRA, identity, signature, or document integration, and no enforced multi-user authorization.


Mock data reconciliation:
- Reporting date: November 15, 2024. Current cohorts do not change when selecting a historical comparison period.
- Source: src/data.ts (142 candidates, candidate-level pipeline, readiness, durations, start dates, and risk records); src/work-data.ts (63 tasks + 15 approvals); src/dashboard-data.ts (aggregations).
- Initial KPIs: 142 active, 28 accepted offers, 18 starts within 30 days, 108/142 on track (76% rounded), 18 at risk, 12 overdue tasks, 15 pending approvals, 64 average cycle days.
- Pipeline is cumulative candidates at or beyond each stage, not separate populations. Current stage populations sum to 142.
- Upcoming 30/60/90-day totals are 18/26/34. Monthly bars follow actual record dates; the photographed monthly bars do not reconcile with its rolling totals and are superseded by these source-derived bars.
- Readiness: 12 ready, 8 attention needed, 5 blocked, 3 not started. Owners: 24/18/12/10/8/6 open work items.
- Historical trend snapshots are explicit mock fixtures. Total cycle duration is independent of stage durations, which may overlap.
- Existing locally saved edits are merged onto the expanded seed. Completing tasks and approvals changes dashboard totals and candidate drilldowns.
- Run npm test to verify aggregate totals, all eight tile cohorts, persistence, task transitions, and responsive pages.
