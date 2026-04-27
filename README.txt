FINAL USER FRONTEND - SAME UI VERSION

This keeps the old dashboard-style UI and activates:
- Assign stock
- Transfer stock
- Outlet cards: Pune Central, Pune Airport, Pune NDA
- Stock Room / Sky Bar / Low Bar pages
- Scanner + weight machine flow
- Barcode database fetch
- Remaining ML calculation
- Manual brand search + closing values
- History of scanned items and stock movements

No fake bottle data is included.
Add bottles from Admin Panel first.

Run:
npm install
npm run dev

Vercel env:
VITE_API_URL=https://backend-all-tgww.onrender.com/api
