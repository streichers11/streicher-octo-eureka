# ORHA Money & Retention Dashboard

A Microsoft Teams Tab application that lets the ORHA membership team upload two GrowthZone Excel exports each week and generates an executive-friendly dashboard for money vs budget and retention by territory.

## Architecture

```
├── api/                  # Node.js + Express backend (TypeScript)
│   └── src/
│       ├── index.ts      # Express server entry point
│       ├── routes/       # API routes (dashboard, upload, admin)
│       ├── services/     # Business logic (calculator, excelParser)
│       ├── storage/      # Persistence layer (JSON file store for MVP)
│       └── types/        # TypeScript type definitions
├── tabs/                 # React frontend (TypeScript + Fluent UI)
│   └── src/
│       ├── App.tsx       # Main app with routing
│       ├── pages/        # DashboardPage, AdminPage
│       ├── components/   # KpiCards, TerritoryTable, PastDuePanel, etc.
│       ├── services/     # API client
│       └── types/        # Shared types
├── appPackage/           # Teams app manifest
├── tests/                # Unit tests (Jest)
├── env/                  # Teams Toolkit environment files
├── teamsapp.yml          # Teams Toolkit project config
└── teamsapp.local.yml    # Teams Toolkit local dev config
```

## Prerequisites

- Node.js 18+
- npm 9+
- Microsoft Teams Toolkit (VS Code extension) — for Teams integration
- A Microsoft 365 developer tenant (for Teams SSO)

## Local Setup

### 1. Install dependencies

```bash
# From project root
npm install
cd api && npm install && cd ..
cd tabs && npm install && cd ..
```

### 2. Configure environment

Copy and edit the `.env` file at project root:

```bash
cp .env .env.local
```

Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `API_PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `AZURE_CLIENT_ID` | Azure AD app client ID | — |
| `AZURE_CLIENT_SECRET` | Azure AD app client secret | — |
| `AZURE_TENANT_ID` | Azure AD tenant ID | — |
| `ADMIN_GROUP_ID` | Azure AD group ID for admin access | — |

### 3. Start development servers

```bash
# Start both API and frontend concurrently
npm run dev

# Or start individually:
cd api && npm run dev    # API on http://localhost:3001
cd tabs && npm start     # Frontend on http://localhost:3000
```

### 4. Seed data

On first startup, the API automatically seeds:
- **Budgets**: Jan 2026 and Feb 2026 (Restaurant Dues + Vendor Program)
- **Manual Adjustment**: Feb 2026 $57,000 accounting company check

## Running Tests

```bash
cd api && npm test
```

Tests cover:
- Vendor vs Restaurant Dues categorization (`isVendorFeeItem`)
- New vs Retained money classification (`isNewMoney`)
- Paid flag logic for retention (`isPaid`)
- Totals row detection and removal (`isTotalsRow`)
- Payment filtering by month
- Full money metrics calculation with manual adjustments
- Retention metrics and past-due list generation

## Teams Toolkit Integration

### Run in Teams (local debug)

1. Open the project in VS Code with Teams Toolkit installed
2. Press F5 or use "Teams Toolkit > Start Local Debug"
3. Teams Toolkit will:
   - Create a dev Azure AD app
   - Generate local certificates
   - Start the API and tab servers
   - Sideload the app into Teams

### Provision & Deploy

```bash
# Provision Azure resources
teamsfx provision --env dev

# Deploy the app
teamsfx deploy --env dev

# Publish to Teams
teamsfx publish --env dev
```

## Required Azure Resources

For production deployment:

| Resource | Purpose |
|----------|---------|
| Azure App Service (or Static Web Apps) | Host the frontend + API |
| Azure AD App Registration | Teams SSO authentication |
| Azure Storage Account | (Future) Blob storage for uploaded files |

For MVP, the app uses a local JSON file store under `api/data/`. For production, swap the storage layer in `api/src/storage/store.ts` to use Azure Table Storage or Cosmos DB.

## Configuring Admin Access (Azure AD Group)

1. In Azure AD, create a Security Group (e.g., "ORHA Dashboard Admins")
2. Add the team members who should have admin access
3. Copy the Group Object ID
4. Set `ADMIN_GROUP_ID` in your environment config
5. The API middleware checks group membership via MS Graph (implement in `api/src/middleware/auth.ts` for production)

For MVP, the Admin tab is accessible to all authenticated users. Restrict it in production by adding the auth middleware.

## Weekly Usage

### How to update the dashboard each week

1. **Export from GrowthZone**:
   - Run the "ORHA Membership Payment Report" export → download as `.xlsx`
   - Run the "ORHA Membership Monthly Renewal" export → download as `.xlsx`

2. **Upload in Teams**:
   - Open the ORHA Dashboard tab in Teams
   - Go to the **Admin** tab
   - Select the correct **Year** and **Month**
   - Upload the Payments file under "Payments Report"
   - Upload the Retention file under "Retention Report"

3. **View the Dashboard**:
   - Switch to the **Dashboard** tab
   - Select the month to view
   - Review KPI cards, territory breakdown, and past-due list

### Managing budgets

1. Go to **Admin** > **Monthly Budgets**
2. Enter the Restaurant Dues and Vendor Program budget amounts
3. Click "Save Budgets"

### Adding manual adjustments

1. Go to **Admin** > **Manual Adjustments**
2. Enter the date, amount, category, and notes
3. Click "Add Adjustment"
4. The adjustment will be reflected in the dashboard totals

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard?year=YYYY&month=M` | Full dashboard data |
| `POST` | `/api/upload/payments` | Upload payments Excel |
| `POST` | `/api/upload/retention` | Upload retention Excel |
| `GET` | `/api/admin/budgets` | List budgets |
| `PUT` | `/api/admin/budgets` | Create/update budget |
| `GET` | `/api/admin/adjustments` | List manual adjustments |
| `POST` | `/api/admin/adjustments` | Create adjustment |
| `PUT` | `/api/admin/adjustments/:id` | Update adjustment |
| `DELETE` | `/api/admin/adjustments/:id` | Delete adjustment |
| `GET` | `/api/admin/uploads` | Upload history |

## Business Logic Reference

### Money Categorization
- **Vendor Program**: Fee Item contains "Vendor" (case-insensitive)
- **Restaurant Dues**: Everything else

### New vs Retained Money
- **New Money**: Membership Start Date year == selected year
- **Retained Money**: All other payments

### Retention Paid Flag
- **Paid**: Amount Due == 0 OR Paid Date is not empty

### Totals Row Removal
- Rows where any field contains "Count" AND "Totals" are automatically excluded

## Extension Points (v2)

- **SharePoint auto-ingest**: Watch a SharePoint folder for new Excel uploads
- **Scheduled refresh**: Use Azure Functions timer trigger to re-parse stored files
- **Power Automate trigger**: HTTP webhook to trigger dashboard refresh
- **Azure Table/Cosmos DB**: Replace JSON file store for production scale
- **Teams SSO middleware**: Add `@azure/msal-node` token validation to protect API routes
- **Territory budget allocation**: Break down budgets by territory
- **Historical trend charts**: Show month-over-month performance using Recharts
