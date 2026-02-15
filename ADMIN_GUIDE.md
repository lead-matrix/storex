# 👑 THE OBSIDIAN PALACE - ADMIN GUIDE
## Complete Admin Portal User Manual

---

## 🎯 **What You'll Experience**

Your admin portal is a **luxury, high-end CMS** designed to give you complete control over your e-commerce empire. Think of it as your **command center** for managing products, orders, customers, and your entire business.

---

## 🔐 **STEP 1: GETTING ADMIN ACCESS**

### **First-Time Setup**

#### **A. Create Your Admin Account**

1. **Sign Up** at: `https://dinacosmetic.store/login`
   - Enter your email
   - Create a strong password
   - Click "Sign Up"

2. **Verify Your Email**
   - Check your inbox
   - Click the verification link
   - You'll be redirected back

3. **Get Admin Role** (One-time setup)
   - Go to Supabase Dashboard
   - Navigate to: **Table Editor** → **profiles**
   - Find your user (by email)
   - Change `role` from `user` to `admin`
   - Click **Save**

#### **B. Login Process**

**URL**: `https://dinacosmetic.store/login`

**Visual Experience**:
- Elegant black background with flowing gold accents
- Centered login form with "The Obsidian Palace" branding
- Gold-bordered input fields
- Smooth animations on hover

**Steps**:
1. Enter your email address
2. Enter your password
3. Click the gold "LOGIN" button
4. You'll be automatically redirected to `/admin`

**Security**:
- ✅ Middleware protects admin routes
- ✅ Only users with `role = 'admin'` can access
- ✅ Session-based authentication
- ✅ Auto-logout after inactivity

---

## 🏛️ **STEP 2: THE ADMIN DASHBOARD**

### **What You'll See**

Upon login, you'll land on the **Dashboard** - your business overview at a glance.

#### **Layout**:

**Left Sidebar** (Always visible):
- 🏠 **Dashboard** - Overview & stats
- 📦 **Products** - Manage inventory
- 🛒 **Orders** - View & process orders
- 👥 **Users** - Customer management
- ⚙️ **Settings** - Store configuration

**Main Content Area**:

**Top Section - Key Metrics** (4 Cards):
1. **💰 Total Revenue**
   - Shows: Total sales in BDT
   - Updates: Real-time
   - Visual: Large gold number

2. **📊 Orders**
   - Shows: Total order count
   - Updates: Real-time
   - Visual: Order count with trend

3. **👤 Active Users**
   - Shows: Registered customers
   - Updates: Daily
   - Visual: User count

4. **📦 Live Products**
   - Shows: Active products in store
   - Updates: Real-time
   - Visual: Product count

**Bottom Section - Recent Orders**:
- Table showing last 10 orders
- Columns: Order ID, Customer, Product, Date, Total, Status
- Click any order to view details
- Gold "View All" button to see complete list

### **Navigation**:
- Click any sidebar item to navigate
- Active page highlighted in gold
- Smooth page transitions
- Breadcrumb trail at top

---

## 📦 **STEP 3: PRODUCT MANAGEMENT**

### **Accessing Products**

Click **Products** in sidebar → You'll see the Product Management screen

### **What You Can Do**:

#### **A. View All Products**

**Table Columns**:
- **Image**: Product thumbnail
- **Product Name**: Click to edit
- **Price**: In BDT
- **Stock**: Current inventory
- **Status**: Active/Inactive
- **Actions**: Edit ✏️ | Delete 🗑️

**Features**:
- 🔍 **Search**: Find products by name
- 🎯 **Filter**: By category, status, price range
- 📄 **Pagination**: 20 products per page
- ⬆️⬇️ **Sort**: By any column

#### **B. Add New Product**

**Button**: Gold "Add New Product" (top right)

**Form Fields**:

1. **Basic Information**:
   - Product Name (required)
   - Slug (auto-generated from name)
   - Description (rich text editor)
   - Category (dropdown)

2. **Pricing**:
   - Base Price (BDT)
   - Compare At Price (optional, for discounts)
   - Cost Per Item (for profit tracking)

3. **Inventory**:
   - SKU (auto-generated or custom)
   - Stock Quantity
   - Track Inventory (toggle)
   - Allow Backorders (toggle)

4. **Media**:
   - Primary Image (drag & drop or browse)
   - Additional Images (up to 5)
   - Image Alt Text (for SEO)

5. **Variants** (Optional):
   - Add Size/Color/Material variants
   - Each variant has own price & stock
   - Example: "Red - Small", "Blue - Large"

6. **Status**:
   - Active (visible in store)
   - Draft (hidden from customers)

**Actions**:
- **Save**: Publish product
- **Save as Draft**: Save without publishing
- **Cancel**: Discard changes

#### **C. Edit Product**

**How**: Click ✏️ Edit button on any product

**What You Can Change**:
- All product details
- Upload new images
- Adjust pricing
- Update stock
- Change status

**Quick Actions**:
- **Duplicate**: Clone product with new name
- **Archive**: Hide without deleting
- **Delete**: Permanent removal (requires confirmation)

#### **D. Bulk Actions**

**Select Multiple Products**:
- Checkbox on each row
- "Select All" at top

**Bulk Operations**:
- Activate/Deactivate
- Change category
- Adjust prices (% increase/decrease)
- Delete selected
- Export to CSV

---

## 🛒 **STEP 4: ORDER MANAGEMENT**

### **Accessing Orders**

Click **Orders** in sidebar

### **What You'll See**:

**Order List Table**:
- Order Number (e.g., #ORD-001234)
- Customer Name & Email
- Products Ordered
- Order Date & Time
- Total Amount
- Payment Status (Paid/Pending/Failed)
- Fulfillment Status (Unfulfilled/Fulfilled/Shipped)
- Actions

### **Order Details**:

**Click any order** to see:

1. **Customer Information**:
   - Name, Email, Phone
   - Shipping Address
   - Billing Address (if different)

2. **Order Items**:
   - Product name & image
   - Variant (if applicable)
   - Quantity
   - Price per item
   - Subtotal

3. **Order Summary**:
   - Subtotal
   - Shipping Cost
   - Tax (if applicable)
   - **Total**

4. **Payment Details**:
   - Payment Method (Stripe)
   - Transaction ID
   - Payment Status
   - Date Paid

5. **Timeline**:
   - Order Placed
   - Payment Confirmed
   - Fulfillment Started
   - Shipped
   - Delivered

### **Actions You Can Take**:

#### **A. Fulfill Order**

**When**: After payment confirmed

**Steps**:
1. Click "Fulfill Order" button
2. Review items to ship
3. Click "Create Shipping Label" (Shippo integration)
4. Print label
5. Mark as "Fulfilled"

**What Happens**:
- ✅ Stock automatically decremented
- ✅ Customer receives "Order Shipped" email
- ✅ Tracking number added to order
- ✅ Order status updated

#### **B. Refund Order**

**When**: Customer requests refund

**Steps**:
1. Open order details
2. Click "Refund" button
3. Select items to refund (partial or full)
4. Enter refund reason
5. Confirm refund

**What Happens**:
- ✅ Stripe processes refund
- ✅ Stock restored
- ✅ Customer notified via email
- ✅ Order marked as "Refunded"

#### **C. Cancel Order**

**When**: Order not yet fulfilled

**Steps**:
1. Click "Cancel Order"
2. Enter cancellation reason
3. Confirm

**What Happens**:
- ✅ Payment refunded (if paid)
- ✅ Stock restored
- ✅ Customer notified
- ✅ Order archived

### **Order Filters**:

- **By Status**: All, Pending, Paid, Fulfilled, Shipped, Delivered, Cancelled
- **By Date**: Today, Last 7 days, Last 30 days, Custom range
- **By Amount**: Under $50, $50-$100, $100-$500, Over $500
- **By Customer**: Search by name or email

### **Export Orders**:

**Button**: "Export to CSV" (top right)

**What You Get**:
- All order data in spreadsheet
- Use for accounting, analytics, reporting
- Includes customer info, products, totals

---

## 👥 **STEP 5: USER MANAGEMENT**

### **Accessing Users**

Click **Users** in sidebar

### **What You'll See**:

**User List Table**:
- User ID
- Name
- Email
- Role (Admin/User)
- Registration Date
- Total Orders
- Total Spent
- Status (Active/Inactive)
- Actions

### **User Details**:

**Click any user** to see:

1. **Profile Information**:
   - Full name
   - Email address
   - Phone number
   - Role

2. **Order History**:
   - All orders placed
   - Total lifetime value
   - Average order value
   - Last order date

3. **Activity**:
   - Last login
   - Account created date
   - Email verified status

### **Actions You Can Take**:

#### **A. Change User Role**

**Use Case**: Promote user to admin or demote admin

**Steps**:
1. Click user to open details
2. Click "Edit Role"
3. Select: Admin or User
4. Save changes

**Warning**: Be careful! Admins have full access.

#### **B. Deactivate User**

**Use Case**: Suspend problematic accounts

**Steps**:
1. Open user details
2. Click "Deactivate Account"
3. Confirm

**Effect**: User cannot login, orders preserved

#### **C. Delete User**

**Use Case**: Remove spam accounts

**Steps**:
1. Open user details
2. Click "Delete User"
3. Confirm (requires password)

**Warning**: Permanent! All data deleted.

---

## ⚙️ **STEP 6: SETTINGS**

### **Accessing Settings**

Click **Settings** in sidebar

### **Available Settings**:

#### **A. Store Information**

- Store Name
- Store Description
- Contact Email
- Phone Number
- Business Address
- Tax ID (if applicable)

#### **B. Shipping Settings**

- Default Shipping Rate
- Free Shipping Threshold
- Shippo API Configuration
- Shipping Zones
- Delivery Time Estimates

#### **C. Payment Settings**

- Stripe Configuration
- Accepted Payment Methods
- Currency (BDT)
- Tax Settings

#### **D. Email Settings**

- Resend API Configuration
- Email Templates:
  - Order Confirmation
  - Shipping Notification
  - Refund Confirmation
  - Welcome Email

#### **E. Notifications**

- Email Notifications (toggle)
- Order Alerts (toggle)
- Low Stock Alerts (toggle)
- New Customer Alerts (toggle)

#### **F. Security**

- Change Password
- Two-Factor Authentication (optional)
- Session Timeout
- Login History

---

## 🎨 **VISUAL DESIGN EXPERIENCE**

### **Color Palette**:
- **Background**: Deep Black (#000000)
- **Primary**: Liquid Gold (#D4AF37)
- **Text**: White (#FFFFFF)
- **Borders**: Gold with subtle glow

### **Typography**:
- **Headings**: Playfair Display (Serif, Elegant)
- **Body**: Inter (Sans-serif, Clean)
- **Numbers**: Tabular figures for alignment

### **Interactions**:
- **Hover**: Gold glow effect
- **Click**: Smooth scale animation
- **Loading**: Elegant gold spinner
- **Success**: Gold checkmark with fade-in
- **Error**: Red alert with shake animation

### **Responsive**:
- **Desktop**: Full sidebar + main content
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation bar

---

## 🚀 **BEST PRACTICES & TIPS**

### **Daily Routine**:

**Morning** (5 minutes):
1. Check Dashboard for overnight orders
2. Review any low stock alerts
3. Check for customer messages

**Throughout Day**:
1. Fulfill new orders within 24 hours
2. Respond to customer inquiries
3. Update product stock as needed

**Evening** (10 minutes):
1. Review day's sales
2. Check for any issues
3. Plan next day's tasks

### **Weekly Tasks**:

**Monday**:
- Review last week's performance
- Plan promotions/sales

**Wednesday**:
- Check inventory levels
- Order new stock if needed

**Friday**:
- Export orders for accounting
- Review customer feedback

### **Monthly Tasks**:

- Analyze sales trends
- Update product descriptions
- Review pricing strategy
- Clean up old/inactive products
- Backup data

### **Pro Tips**:

1. **Use Keyboard Shortcuts**:
   - `Ctrl + K`: Quick search
   - `Ctrl + N`: New product
   - `Ctrl + S`: Save changes

2. **Bulk Operations**:
   - Use filters to find products
   - Select all matching
   - Apply bulk action
   - Saves tons of time!

3. **Product Images**:
   - Use high-quality images (1200x1200px)
   - White or transparent background
   - Show multiple angles
   - Compress for fast loading

4. **Descriptions**:
   - Write compelling copy
   - Include keywords for SEO
   - Highlight benefits, not just features
   - Use bullet points

5. **Pricing**:
   - Research competitors
   - Factor in all costs
   - Use psychological pricing ($99 vs $100)
   - Offer bundles/discounts

6. **Inventory**:
   - Set low stock alerts (e.g., 5 units)
   - Never oversell
   - Update stock immediately after receiving shipment
   - Use SKUs for tracking

7. **Customer Service**:
   - Respond within 24 hours
   - Be professional but friendly
   - Offer solutions, not excuses
   - Follow up after resolution

---

## 🆘 **TROUBLESHOOTING**

### **Can't Login?**

**Issue**: "Invalid credentials" error

**Solutions**:
1. Check email spelling
2. Use "Forgot Password" link
3. Clear browser cache
4. Try incognito mode
5. Check if account is verified

### **Can't Access Admin?**

**Issue**: Redirected to homepage

**Solutions**:
1. Verify role is "admin" in Supabase
2. Clear cookies and re-login
3. Check middleware is working
4. Contact developer

### **Products Not Showing?**

**Issue**: Products not visible in store

**Solutions**:
1. Check product status is "Active"
2. Verify stock > 0 (if tracking inventory)
3. Check category is published
4. Clear cache
5. Check is_active = true in database

### **Orders Not Appearing?**

**Issue**: Customer says they ordered but you don't see it

**Solutions**:
1. Check Stripe dashboard for payment
2. Search by customer email
3. Check "All Orders" (not just "Pending")
4. Verify webhook is working
5. Check Supabase logs

### **Images Not Uploading?**

**Issue**: Product images fail to upload

**Solutions**:
1. Check file size (max 5MB)
2. Use supported formats (JPG, PNG, WebP)
3. Verify Supabase Storage is configured
4. Check storage bucket permissions
5. Try smaller image

---

## 📊 **UNDERSTANDING METRICS**

### **Revenue**:
- **Total Revenue**: All-time sales
- **Today's Revenue**: Sales today
- **Monthly Revenue**: This month's sales
- **Average Order Value**: Revenue ÷ Orders

### **Orders**:
- **Total Orders**: All-time count
- **Pending**: Awaiting fulfillment
- **Fulfilled**: Shipped/delivered
- **Cancelled**: Cancelled orders
- **Conversion Rate**: Orders ÷ Visitors

### **Products**:
- **Live Products**: Active in store
- **Draft Products**: Not published
- **Out of Stock**: Zero inventory
- **Low Stock**: Below threshold

### **Users**:
- **Total Users**: All registered
- **Active Users**: Logged in last 30 days
- **New Users**: Registered this month
- **Returning Customers**: 2+ orders

---

## 🎯 **SUCCESS METRICS**

Track these KPIs:

1. **Sales Growth**: Month-over-month increase
2. **Conversion Rate**: Visitors → Customers
3. **Average Order Value**: Revenue per order
4. **Customer Retention**: Repeat purchase rate
5. **Inventory Turnover**: How fast stock sells
6. **Fulfillment Time**: Order → Shipped
7. **Customer Satisfaction**: Reviews/ratings

---

## 📞 **SUPPORT**

### **Need Help?**

**Documentation**:
- This guide
- `README.md` in project root
- `DEPLOYMENT_GUIDE.md`

**Technical Issues**:
- Check Vercel logs
- Check Supabase logs
- Check Stripe dashboard

**Feature Requests**:
- Document what you need
- Explain use case
- Contact developer

---

## 🎉 **YOU'RE READY!**

You now have **complete control** over your e-commerce empire. The Obsidian Palace admin portal is your **command center** for success.

**Remember**:
- ✅ Login at `/login` with admin credentials
- ✅ Dashboard shows real-time business overview
- ✅ Products page for inventory management
- ✅ Orders page for fulfillment
- ✅ Users page for customer management
- ✅ Settings for store configuration

**Your admin experience is**:
- 🎨 **Beautiful**: Luxury black & gold design
- ⚡ **Fast**: Real-time updates
- 🔒 **Secure**: Role-based access control
- 📱 **Responsive**: Works on all devices
- 🎯 **Powerful**: Complete business control

**Now go build your empire!** 👑
