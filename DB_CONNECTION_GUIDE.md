# 🗄️ Database Connection Guide: Postgres URL
**Target Domain:** [dinacosmetic.store](https://dinacosmetic.store)

The PostgreSQL Connection String (Database URL) is the "master key" for your database. While our Next.js app primarily uses the Supabase API URL and Anon Key, this string is required for **direct database management** and **Vercel environment parity**.

---

## 📍 1. Where to find it (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects).
2. Click the **Project** (e.g., `qvcxustdtpphagloissl`).
3. Click the **Settings** (Gear Icon ⚙️) in the bottom-left sidebar.
4. Click **Database** in the settings menu.
5. Scroll down to the **Connection String** section.
6. Select the **Transaction** tab (this is recommended for Serverless/Vercel).
7. Copy the URL. It will look like this:
   `postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

> [!IMPORTANT]
> Change `[YOUR-PASSWORD]` to the actual password you set when you created the Supabase project.

---

## 🚀 2. Where to put it (Vercel)
1. Go to your **Vercel Project Settings**.
2. Navigate to **Environment Variables**.
3. Create a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the string from Step 1.
4. Ensure it is available in **Production**, **Preview**, and **Development**.

---

## 🛠️ 3. When to use it
- **Vercel Deployments**: Keeps your database connection robust under high traffic.
- **External Tools**: Use this string to connect with tools like **DBeaver**, **TablePlus**, or **pgAdmin** for bulk data editing.
- **Local Migrations**: If you run `supabase db push` or similar commands from your local machine, this URL allows the CLI to "talk" to your live server.

---

## 💡 Pro Tip
If you lose your database password, you can **Reset Database Password** in the same **Settings > Database** screen where you found the connection string.
