# ⛽ Balance Helper — Backend API

Node.js + Express + MongoDB + JWT

---

## Quick Start

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then edit `.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — a long random string
- `JWT_REFRESH_SECRET` — a different long random string

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

### Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Create account |
| POST | `/login` | ❌ | Login, get tokens |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Logout (one device) |
| POST | `/logout-all` | ✅ | Logout all devices |
| GET | `/me` | ✅ | Get current user |
| PUT | `/profile` | ✅ | Update name / theme |
| PUT | `/password` | ✅ | Change password |
| PUT | `/pin` | ✅ | Set / change / remove PIN |
| POST | `/verify-pin` | ✅ | Verify PIN before delete |

**Register**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
// Returns: { accessToken, refreshToken, user }
```

**Refresh Token**
```json
POST /api/auth/refresh
{
  "refreshToken": "eyJ..."
}
// Returns: { accessToken, refreshToken }
```

---

### Records  `/api/records`

All require `Authorization: Bearer <accessToken>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All records (optional: ?from=&to=&shift=) |
| GET | `/:id` | Single record |
| POST | `/` | Create record |
| PUT | `/:id` | Update record |
| DELETE | `/:id` | Soft delete record |
| POST | `/sync` | Bulk upsert from device |
| GET | `/monthly` | Monthly aggregated stats |

**Create / Update Record Body**
```json
{
  "localId": "uuid-generated-on-device",
  "date": "2025-06-15",
  "shift": "morning",
  "pumps": [
    { "num": 1, "open": 10000, "close": 10500, "price": 700, "liters": 500, "amount": 350000 }
  ],
  "pos": 50000,
  "deposits": [
    { "label": "Cash 1", "value": 200000 },
    { "label": "Cash 2", "value": 100000 }
  ],
  "totalLiters": 500,
  "totalAmountDue": 350000,
  "totalDeposited": 350000,
  "diff": 0
}
```

**Sync (bulk upsert)**
```json
POST /api/records/sync
{
  "records": [ ...array of record objects with localId ]
}
```

**Monthly Summary Response**
```json
{
  "monthly": [
    {
      "_id": "2025-06",
      "totalLiters": 12500,
      "totalAmountDue": 8750000,
      "totalDeposited": 8748000,
      "totalOvers": 5000,
      "totalShorts": 7000,
      "netBalance": -2000,
      "shiftCount": 24,
      "shifts": [...]
    }
  ]
}
```

---

## Deployment (Railway / Render)

### Railway
1. Push server folder to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-detects `npm start`

### Render
1. New Web Service → connect GitHub repo
2. Build command: `npm install`
3. Start command: `node index.js`
4. Add env vars in Render dashboard

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
ALLOWED_ORIGINS=https://your-app-domain.com
```

---

## Project Structure

```
server/
├── index.js                    ← Entry point, Express app
├── .env.example                ← Copy to .env and fill in
├── package.json
└── src/
    ├── config/
    │   └── db.js               ← MongoDB connection
    ├── models/
    │   ├── User.js             ← User schema + password/PIN hashing
    │   └── Record.js           ← Shift record schema
    ├── middleware/
    │   └── authMiddleware.js   ← JWT protect + token generator
    ├── controllers/
    │   ├── authController.js   ← Register, login, refresh, PIN
    │   └── recordsController.js← CRUD, sync, monthly stats
    └── routes/
        ├── auth.js             ← /api/auth/*
        └── records.js          ← /api/records/*
```
