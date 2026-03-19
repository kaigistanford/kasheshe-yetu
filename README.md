# Kasheshe Yetu – Complete Setup & Deployment Guide

---

## 📁 Project Structure

```
kasheshe-yetu/
├── .github/workflows/deploy.yml   ← GitHub Actions auto-deploy
├── src/
│   ├── components/
│   │   ├── auth/ProtectedRoute.jsx
│   │   ├── common/Modal.jsx
│   │   └── layout/{Layout, Sidebar}.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── LanguageContext.jsx
│   ├── i18n/
│   │   ├── en.js                  ← English translations
│   │   └── sw.js                  ← Swahili translations
│   ├── lib/supabase.js            ← Supabase client
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Members.jsx
│   │   ├── Contributions.jsx
│   │   ├── Announcements.jsx
│   │   ├── Events.jsx
│   │   ├── Constitution.jsx
│   │   ├── Reports.jsx
│   │   ├── Profile.jsx
│   │   └── Login.jsx
│   ├── utils/
│   │   ├── calculations.js
│   │   └── exports.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── schema.sql                 ← Run first in Supabase
│   └── seed.sql                   ← Run second (member data)
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 STEP 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project** → name it `kasheshe-yetu`
3. Choose a strong database password and save it
4. Wait for the project to finish creating (~2 minutes)

---

## 🗄️ STEP 2: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** – you should see "Success"
5. Click **New Query** again
6. Copy and paste `supabase/seed.sql`
7. Click **Run** – this imports all 47 member records

**Verify the import:**
```sql
SELECT COUNT(*) FROM members;          -- Should return 47
SELECT SUM(amount) FROM contributions; -- Should show total funds
```

---

## 🔑 STEP 3: Get Supabase Keys

1. In Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abcxyz.supabase.co`)
   - **anon public** key (long JWT string)

---

## 👤 STEP 4: Create Admin User

1. In Supabase dashboard → **Authentication** → **Users** → **Invite user**
2. Enter the admin's email address
3. After the user accepts the invite and sets a password, run this SQL to set their role:
```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin Name Here'
WHERE email = 'admin@example.com';
```
4. To link the admin to a member record:
```sql
UPDATE public.members
SET profile_id = (SELECT id FROM profiles WHERE email = 'admin@example.com')
WHERE member_number = 'KY-001';  -- Change to correct member number
```

**Creating other users:**
- Go to Authentication → Invite user → enter email
- After they set a password, update their role in `profiles` table:
```sql
UPDATE public.profiles
SET role = 'secretary'  -- or 'treasurer' or 'member'
WHERE email = 'secretary@example.com';
```

---

## 💻 STEP 5: Local Development

```bash
# Clone or create the project
git clone https://github.com/YOUR_USERNAME/kasheshe-yetu.git
cd kasheshe-yetu

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase keys:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Start dev server
npm run dev
```

---

## 🌐 STEP 6: Deploy to GitHub Pages

### Option A: Automatic (GitHub Actions – Recommended)

1. Create a GitHub repository named `kasheshe-yetu`
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/kasheshe-yetu.git
   git push -u origin main
   ```
3. In GitHub repository → **Settings** → **Secrets and variables** → **Actions**
4. Add two secrets:
   - Name: `VITE_SUPABASE_URL` → Value: your Supabase URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your anon key
5. In GitHub repository → **Settings** → **Pages**
   - Source: **GitHub Actions**
6. Push any commit to `main` – the site deploys automatically

### Option B: Manual Deploy

```bash
npm install gh-pages --save-dev
npm run build
npx gh-pages -d dist
```

Your app will be live at: `https://YOUR_USERNAME.github.io/kasheshe-yetu/`

---

## 🔧 STEP 7: Configure Supabase Auth Redirect URLs

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://YOUR_USERNAME.github.io/kasheshe-yetu`
3. Add **Redirect URLs**:
   ```
   https://YOUR_USERNAME.github.io/kasheshe-yetu/reset-password
   http://localhost:5173/kasheshe-yetu/reset-password
   ```

---

## 🎨 Customization Guide

### Change App Name
Edit `src/i18n/sw.js` and `src/i18n/en.js`:
```js
appName: 'Your Group Name',
appTagline: 'Your Tagline Here',
```

### Change Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: {
    800: '#YOUR_COLOR',  // Main brand color
  }
}
```
Then update `src/index.css` gradient on the login page.

### Change Logo
Replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with your logo.
Update the `KY` text initials in `Sidebar.jsx`:
```jsx
<div className="...">KY</div>  // ← Change initials
```

### Change Repo Name / Base Path
Edit `vite.config.js`:
```js
base: '/your-repo-name/',
```
And `App.jsx`:
```jsx
<BrowserRouter basename="/your-repo-name">
```

### Change Monthly Rate
Edit `src/utils/calculations.js`:
```js
export const MONTHLY_RATE = 10000  // ← Change here
export const JOINING_FEE = 10000   // ← And here
export const ANNUAL_EXPECTED = MONTHLY_RATE * 12
```

### Add New Members in Bulk
Use the **Members → Bulk Import** button with a CSV file containing:
```
fullName,phone,email,dateJoined,memberType,role,address,notes
John Doe,0712345678,john@email.com,2024-01-01,regular,member,Dar es Salaam,
```

---

## 🔐 Security Notes

- **Never commit your `.env` file** – add `.env` to `.gitignore`
- Row-level security is enabled on all tables
- The anon key is safe to include in frontend code (it's intentionally public)
- Sensitive operations are blocked at the database level for non-admin roles
- Always use Supabase's built-in Auth – do not store passwords manually

---

## 📱 PWA Installation

Users can install the app on their phone:
- **Android**: Chrome → Menu → "Add to Home Screen"
- **iOS**: Safari → Share → "Add to Home Screen"

---

## 🛠️ Future Improvements

1. **SMS/WhatsApp Notifications** – Integrate Africa's Talking or Twilio for payment reminders
2. **Receipt Printing** – Add PDF receipt generation per payment
3. **M-Pesa/Tigo Pesa Integration** – Auto-capture mobile money payments via webhook
4. **Admin User Management UI** – In-app user creation (currently done via Supabase dashboard)
5. **Bulk Role Assignment** – Change multiple members' roles at once
6. **Meeting Minutes Module** – Record and store meeting decisions
7. **Loan/Advance Module** – Track internal group loans
8. **Photo Gallery** – Store event photos in Supabase Storage
9. **Export to PDF** – Proper PDF generation with company letterhead
10. **Email Notifications** – Automated payment receipts and reminders
11. **Dark Mode** – Add theme toggle
12. **Two-Factor Authentication** – Enhanced security for admin accounts
13. **Offline Mode** – Full PWA offline capability with background sync
14. **Analytics Dashboard** – Advanced charts with trends and forecasting
15. **Multi-Group Support** – Support multiple groups under one platform

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| Login fails | Check Supabase URL and anon key in `.env` |
| RLS blocks data | Run `schema.sql` again; ensure `get_my_role()` function exists |
| Pages 404 on reload | Ensure `base` in `vite.config.js` matches your repo name |
| Members not showing | Check that `seed.sql` ran successfully |
| Seed fails with foreign key error | Run `schema.sql` first, then `seed.sql` |
| Irregular amounts flagged | Expected – admin should review and correct |
| Auth redirect fails | Add your Pages URL to Supabase Auth redirect URLs |

---

© 2024 Kasheshe Yetu – Haya Community Group
