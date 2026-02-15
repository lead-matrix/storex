# 👑 THE OBSIDIAN PALACE - ADMIN MANUAL

## 1. 🔑 HOW TC ACCESS & LOGIN

### **The Login Page**
- **URL**: [https://dinacosmetic.store/login](https://dinacosmetic.store/login) (or `http://localhost:3000/login` in dev)
- **Unified Login**: There is no separate "Admin Login" page. Admins and Customers use the same login screen.

### **How to Enter the Admin Portal**
1.  Go to the login page.
2.  Enter your **Admin Email** and **Password**.
3.  Click **"Authorize Access"**.
4.  **If you are an Admin**: You will be automatically redirected to the **Admin Dashboard** (`/admin`).
5.  **If you are a Customer**: You will go to the Shop or Profile page.

---

## 2. 🛡️ HOW TO BECOME AN ADMIN

*security Note: You cannot "Sign Up" as an admin directly. This prevents unauthorized access.*

### **Step-by-Step Promotion:**
1.  **Sign Up** naturally as a user on the website.
2.  Access your **Supabase Database** (or use the SQL editor).
3.  Run this command to promote your email to Admin:
    ```sql
    UPDATE profiles 
    SET role = 'admin' 
    WHERE email = 'your.email@example.com';
    ```
    *(Replace with your actual email)*
4.  **Log out and Log back in**. You now have full access.

---

## 3. 🖥️ THE INTERFACE: WHAT YOU SEE

### **Dashboard Overview**
When you log in, you see the **Command Center**:
- **Black & Gold Theme**: Consistent with the brand.
- **Top Cards**: Real-time stats for **Total Revenue**, **Active Orders**, **Customers**, and **Products**.
- **Recent Orders**: A table showing the latest sales requiring attention.

### **Navigation Sidebar** (Left / Mobile Drawer)
- **📊 Dashboard**: Your main overview.
- **📦 Products**: Manage inventory, prices, and images.
- **🛒 Orders**: Process customer purchases.
- **👥 Users**: View registered customers.
- **⚙️ Settings**: Control website text, footer, and contacts (CMS).

---

## 4. 🛠️ FEATURES & INSTRUCTIONS

### **A. Manage Products**
1.  Click **Products**.
2.  **Add New**: Click the generic "+" or "Add Product" button.
    - **Name & Description**: Write compelling copy.
    - **Price**: Set in BDT/USD.
    - **Category**: Select FACE, EYES, LIPS, or TOOLS.
    - **Images**: Upload high-quality photos (Auto-saved to storage).
    - **Inventory**: Set SKU and Stock count.
3.  **Edit**: Click any product row to modify details.
4.  **Delete**: Use the trash icon (Caution: Permanent).

### **B. Manage Orders**
1.  Click **Orders**.
2.  **View Status**: See if Paid, Pending, or Shipped.
3.  **Fulfill**: Click into an order to see shipping details.
4.  **Update**: Change status to "Shipped" once you send the package.

### **C. CMS / Site Settings (No Code Needed)**
*This is where you control the website content.*
1.  Click **Settings**.
2.  **Store Info**: Change your Store Name, Tagline, or Description.
3.  **Contact Info**: Update the Phone Number, Email, and Address shown in the footer.
4.  **Social Links**: Add/Remove links to Instagram, Facebook, TikTok.
5.  **Footer Builder**: 
    - Add new columns (e.g., "Legal", "Help").
    - Add links to pages.
    - **Save Changes**: Updates appear live on the website instantly.

---

## 5. 📱 MOBILE ADMIN
- The portal is **fully responsive**.
- On mobile, the Sidebar becomes a **Drawer Menu** (hamburger icon).
- You can upload product photos directly from your phone's camera gallery.
- You can manage orders and check stats on the go.

---

## 6. 🚀 LAUNCH CHECKLIST
1.  [ ] **Create your Admin Account** (and promote via SQL).
2.  [ ] **Configure Settings**: Add your real phone number and address.
3.  [ ] **Add First 5 Products**: Ensure they have images and descriptions.
4.  [ ] **Test an Order**: Run a test checkout to see it appear in the Orders tab.

**You are now ready to rule The Obsidian Palace.** 👑
