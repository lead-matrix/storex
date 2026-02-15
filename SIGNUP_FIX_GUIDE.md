# 🔧 SIGNUP FIX - QUICK GUIDE

## ❌ **PROBLEM**
"Database error saving new user" when trying to sign up

## ✅ **SOLUTION**
Run the signup fix SQL to auto-create user profiles

---

## 🚀 **QUICK FIX (2 MINUTES)**

### **Step 1: Open Supabase**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor"

### **Step 2: Run Fix**
1. Open file: `supabase-signup-fix.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click "Run"

### **Step 3: Verify**
You should see output showing:
- ✅ Trigger created: `on_auth_user_created`
- ✅ Function created: `handle_new_user`
- ✅ Policies created: 4 policies on `profiles` table

### **Step 4: Test**
1. Go to: http://localhost:3000/login
2. Click "Sign Up" tab
3. Enter:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Create Account"
5. Should see success message!

---

## 🎯 **WHAT THIS FIXES**

### **The Problem:**
When users sign up, Supabase creates an `auth.users` record, but your app needs a `profiles` record too. Without a trigger, the profile doesn't get created automatically.

### **The Solution:**
1. **Trigger**: Auto-creates profile when user signs up
2. **RLS Policies**: Allows users to insert their own profile
3. **Permissions**: Grants necessary database access

---

## 📋 **WHAT WAS CREATED**

### **Database Trigger:**
```sql
on_auth_user_created
```
- Runs automatically when user signs up
- Creates profile record
- Sets default role to 'customer'

### **Database Function:**
```sql
handle_new_user()
```
- Inserts into profiles table
- Copies email and name from signup
- Sets default values

### **RLS Policies:**
1. `profiles_select` - Anyone can read profiles
2. `profiles_insert` - Users can create their own profile
3. `profiles_update_own` - Users can update their own profile
4. `profiles_admin_all` - Admins can do everything

---

## 🧪 **TESTING SIGNUP**

### **Test User Signup:**
1. Visit: http://localhost:3000/login
2. Click "Sign Up" tab
3. Fill in form
4. Click "Create Account"

### **Expected Result:**
✅ "Account created! Please check your email to verify your account."

### **Verify in Supabase:**
1. Go to Table Editor
2. Open `profiles` table
3. Should see new row with:
   - id (UUID)
   - email
   - full_name
   - role: 'customer'
   - created_at

---

## 🔐 **SECURITY**

### **RLS Enabled:**
- ✅ Users can only edit their own profile
- ✅ Admins can manage all profiles
- ✅ Public can read profiles (for admin UI)

### **Default Role:**
- ✅ New users get 'customer' role
- ✅ Admins must be set manually in database

---

## 🎨 **MAKING FIRST ADMIN**

After signup works, make yourself admin:

### **Method 1: Supabase Dashboard**
1. Go to Table Editor
2. Open `profiles` table
3. Find your user
4. Change `role` from 'customer' to 'admin'
5. Save

### **Method 2: SQL**
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## 🐛 **TROUBLESHOOTING**

### **Still Getting Error?**

**Check 1: Trigger Exists**
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```
Should return 1 row.

**Check 2: Function Exists**
```sql
SELECT * FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```
Should return 1 row.

**Check 3: Policies Exist**
```sql
SELECT * FROM pg_policies
WHERE tablename = 'profiles';
```
Should return 4 rows.

**Check 4: RLS Enabled**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```
`rowsecurity` should be `true`.

---

## ✅ **AFTER FIX CHECKLIST**

- [ ] Ran `supabase-signup-fix.sql`
- [ ] Verified trigger exists
- [ ] Tested signup with new email
- [ ] Received success message
- [ ] Profile created in database
- [ ] Made yourself admin
- [ ] Can access `/admin` dashboard

---

## 🎊 **SUCCESS!**

Once this fix is applied:
- ✅ Users can sign up
- ✅ Profiles auto-create
- ✅ Email verification works
- ✅ Login works
- ✅ Admin access works

---

## 📝 **NEXT STEPS**

1. ✅ Fix signup (this guide)
2. Run `supabase-settings-migration.sql`
3. Test all features
4. Deploy to production

---

**Your signup is now working!** 🎉
