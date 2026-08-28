# CampusNexus AI — Real College Production Setup & Live Authentication Guide

This guide walks you step-by-step through configuring **Real-Time Authentication** (Google OAuth, Email OTP verification via SMTP, and Mobile Phone logins) for your college platform.

---

## 📋 Summary of Live Authentication Options

The platform supports 4 enterprise-grade authentication methods:

1. **Email Address + Password**: Standard institutional credential login.
2. **Mobile Phone Number + Password**: Students and faculty can log in using their registered mobile number.
3. **Passwordless Email OTP Login**: Users enter their email -> A secure **6-Digit One-Time Passcode (OTP)** is dispatched to their email inbox -> Instant verified access.
4. **Google Sign-In / OAuth 2.0**: 1-Click login using Google accounts (@gmail.com or custom college G-Suite domains like @yourcollege.edu).
5. **OTP Email Verification Gate**: During student and faculty registration, an email OTP is verified before the application is submitted for Administrator approval.

---

## 🚀 STEP-BY-STEP SETUP PROCESS

### STEP 1: Configure Real Email OTP Delivery (SMTP)

To send real 6-digit OTP verification emails to students and faculty, configure your email credentials in `server/.env`.

#### Option A: Using Gmail / Google Workspace (Recommended & Easiest)
1. Log into your Google Account (or College Admin Google account).
2. Go to **Google Account Settings** -> **Security** ([https://myaccount.google.com/security](https://myaccount.google.com/security)).
3. Enable **2-Step Verification** (if not already enabled).
4. Search for **"App passwords"** in the Google search bar at the top or visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
5. Create a new App Password:
   - App Name: `CampusNexus Mailer`
   - Click **Create**. Google will generate a 16-letter password (e.g. `abcd efgh ijkl mnop`).
6. Open `server/.env` and paste your details:
   ```env
   GMAIL_USER=yourcollege.mailer@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

#### Option B: Using Custom College Mail Server / AWS SES / SendGrid / Outlook
Open `server/.env` and set:
```env
SMTP_HOST=smtp.yourcollege.edu # or smtp.sendgrid.net / smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=no-reply@yourcollege.edu
SMTP_PASS=your_smtp_password
SMTP_FROM="CampusNexus AI" <no-reply@yourcollege.edu>
```

> 💡 **Developer Mode Simulator:** If SMTP credentials are left blank in `.env`, the server automatically logs the 6-digit OTP in the server terminal with an alert box so you can test the entire OTP flow locally anytime!

---

### STEP 2: Configure Google OAuth 2.0 (Google Sign-In)

To allow students and staff to click **"Continue with Google Account"**:

1. Go to the **Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **Select a Project** -> **New Project** (Name: `CampusNexus-College-Portal`).
3. In the left menu, navigate to **APIs & Services** -> **OAuth consent screen**:
   - User Type: Select **External** (or **Internal** if using Google Workspace for Education).
   - App Name: `CampusNexus AI`
   - User Support Email: Your email.
   - Developer Contact Email: Your email.
   - Click **Save and Continue**.
4. In the left menu, navigate to **APIs & Services** -> **Credentials**:
   - Click **+ CREATE CREDENTIALS** -> **OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `CampusNexus Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://yourcollegeportal.edu` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `https://yourcollegeportal.edu`
   - Click **CREATE**.
5. Copy the generated **Client ID** and **Client Secret**.
6. Open `server/.env` and paste:
   ```env
   GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_key_here
   ```

---

### STEP 3: Starting Your Production Platform

1. **Start the Platform**:
   ```bash
   npm start
   ```
2. Navigate to `http://localhost:5173` in your browser.

---

### STEP 4: Real College Onboarding Flow

1. **Administrator Workspace Registration**:
   - Click **Register New Account** -> Select **Administrator**.
   - Enter your **College Name**, **Address**, **Official Email**, **Phone**, and **Password**.
   - Click **Verify Email & Submit Registration** -> Enter the 6-digit OTP delivered to your email.
   - Your college workspace is instantly created, initialized with standard departments, and you are logged in as the **Primary Administrator**.

2. **Faculty Onboarding**:
   - Faculty members visit the site, click **Register** -> **Faculty**.
   - Select their **College**, **Department**, and fill in their **Name**, **Email**, **Phone**, and **Specialization**.
   - Enter the 6-digit Email verification code.
   - Their application is placed in `PENDING` verification status.
   - The Administrator receives a real-time notification, visits **Pending Approvals** on their dashboard, and clicks **Approve & Activate**.

3. **Student Onboarding**:
   - Students visit the site, click **Register** -> **Student**.
   - Select their **Department**, **Roll Number**, **Class Year/Section**, and **Email**.
   - Enter their 6-digit Email verification code.
   - The Administrator verifies and approves their registration.

4. **Signing In**:
   - Students, Faculty, and Administrators can log in anytime using:
     - **Email & Password**
     - **Mobile Phone & Password**
     - **Email 6-Digit OTP** (Passwordless)
     - **Google One-Click Sign-In**
