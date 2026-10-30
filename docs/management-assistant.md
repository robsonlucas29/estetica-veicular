# Management assistant and downloadable reports

The gateway authenticates the user's JWT with getUser and checks profiles.role on every request (administrador/gerente). All database reads use that user's JWT and anon key, retaining RLS. No service-role key, SQL execution, database write, arbitrary table selection or outbound message action is exposed.

The existing Responses integration interprets the request into a strict schema with an allowlisted report topic, date range, optional name/plate search and status. Only the user's request and current local date go to OpenAI, with store:false. Private database records are not included in the model input. The server validates the plan and calculates report data deterministically. Manual filter-based reporting works independently of OpenAI availability.

Supported reports: completed services, customer service totals, proportional employee production, receipts/expenses, appointment service lines, current loyalty balances/VIP, and current inventory. Time zone: America/Belem (Macapá). Default period: current calendar month through today. Stock and loyalty are current snapshots, explicitly labeled, rather than historical period values. Employee amounts are split by distinct responsible employees; they are not wages or paid commissions. Finance uses payments.paid_at and finance_expenses.paid_on, separately from performed service values. Search by customer is available on service/customer reports; financial cash totals are global and reject name filters.

PDF and XLSX are generated locally in the authenticated browser from the server's returned data. The on-screen table previews 100 rows; exports include the full result. Spreadsheet strings that could become formulas are escaped. Reads page by id with a hard 20,000-row cap per table; requests exceeding it fail explicitly instead of returning partial totals. No report file is uploaded publicly.

The assistant can generate reports and give advice; edits, deletions, registrations and sending messages remain in the application's dedicated flows. The prompt explicitly prevents false claims that an unsupported action was executed. All model output is rendered as plain React text, not HTML.

Deployment bundles the shared report module into each gateway's index.ts. Source remains modular in _shared/assistant-reports.ts. Production messaging flags and DEV delivery restrictions are preserved.

Validation: scripts/verify-assistant-reports.mjs checks financial/service distinctions, zero-value services, split employee totals, period/date validation, all seven reports, gateway roles, fixed table allowlist, no database row data in the provider payload, and manual reporting without provider calls. PDF and XLSX synthetic exports were generated and parsed. Build and component rendering checks passed. A signed-in browser flow and an actual structured OpenAI response were not exercised during this change.
