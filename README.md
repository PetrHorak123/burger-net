# Burger-Net 🍔

A gamified leaderboard app for burger stand events. Customers spin a prize wheel to get a randomized price, admin records it with a QR flag scan, and the customer scans the same flag after eating to rate their burger and appear on a live leaderboard.

Live at **[burgerhamburger.com](https://burgerhamburger.com)**

---

## How it works

### 1. Admin generates QR flags
Before the event, open `/admin/generate`, enter the PIN, and print a batch of QR flags. Each flag is an 8 × 3 cm strip: a QR code on the left half and a bold flag text on the right. Flags are numbered so they can be matched to orders.

When the customer arrives at the wheel, the admin:

1. Spins the wheel with the customer to determine the price.
2. Scans the next available flag QR code and enters the price — the burger record is created in the database.
3. Gives the customer a **slip of paper with the flag number** (not the flag itself).
4. The flag moves to the **burger preparation station** and waits there until the order is ready.

### 2. Handout station
The customer waits in line holding their numbered slip. When their burger is ready, the handout admin:

1. Receives the customer's number slip.
2. Finds the matching numbered flag and **sticks it into the burger**.
3. Hands the burger (with the flag in it) to the customer.

### 3. Customer scans & registers

After eating, the customer scans the QR code on their flag. If they don't have a profile yet, they see a registration screen:

![Registration screen](docs/screenshots/scan-register.png)

They enter a nickname (and optionally an email). Their profile is stored locally on the device — future scans on the same phone are recognised automatically.

### 4. Rate the burger

After registering (or if already known), the customer rates their burger 1–5 stars:

![Rating screen](docs/screenshots/scan-rate.png)

### 5. Leaderboard

After rating, the customer is taken to the live leaderboard with their entry highlighted:

![Leaderboard](docs/screenshots/leaderboard.png)

The leaderboard updates every 5 seconds and shows each participant's total spend and burger count. Stats at the top show total burgers sold, total revenue, and the average rating across all burgers.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| Database | PostgreSQL via Prisma |
| Styling | Tailwind CSS (amber palette) |
| QR generation | `qrcode` npm package (client-side, data-URL) |
| Deployment | Docker → Dokploy |

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
# PIN required to access admin pages (scan as admin, generate QR codes)
ADMIN_PIN=1234

# PostgreSQL connection string
DATABASE_URL=postgresql://burger:burger@localhost:5432/burgerdb

# Optional: display an announcement bar at the top of every page
ANNOUNCEMENT=
```

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres instance (or point DATABASE_URL at an existing one)
docker run -d --name burgerdb -e POSTGRES_DB=burgerdb -e POSTGRES_USER=burger \
  -e POSTGRES_PASSWORD=burger -p 5432:5432 postgres:16-alpine

# 3. Apply migrations
npx prisma migrate deploy

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker / production

```bash
docker-compose up --build
```

The app runs on port 3000. Set `ADMIN_PIN`, `DATABASE_URL`, and optionally `ANNOUNCEMENT` as environment variables in your deployment platform.

Database migrations (`prisma migrate deploy`) run automatically at container startup.

---

## Admin pages

| Path | Purpose |
|---|---|
| `/admin/generate` | Generate & print a batch of numbered QR flags |

Both admin pages are PIN-protected. The PIN is checked server-side against `ADMIN_PIN`.

---

## Key routes

| Path | Description |
|---|---|
| `/leaderboard` | Live leaderboard (auto-refreshes every 5 s) |
| `/scan?id=<uuid>` | QR landing page — admin price entry or customer claim & rating |
| `/profile` | View your profile and optionally add an email address |
| `/admin/generate` | Printable QR flag sheet |
