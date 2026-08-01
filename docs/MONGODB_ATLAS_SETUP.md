# Setup MongoDB Atlas URI on Railway

## Your MongoDB Connection String

You have a MongoDB Atlas cluster ready:
```
mongodb+srv://amarjeet1111_db_user:<db_password>@cluster0.wtem0dc.mongodb.net/?appName=Cluster0
```

## Step 1: Get Your Password

1. Go to https://cloud.mongodb.com
2. Sign in with your account
3. Go to **Database Access** (left menu)
4. Find user `amarjeet1111_db_user`
5. Click the **Edit** button (pencil icon)
6. Click **Show** next to password to reveal it
7. OR reset the password and create a new one:
   - Click **⋮ (three dots)** → **Edit**
   - Set a new password
   - Copy it

**Make note of the password** (e.g., `MyPassword123!`)

## Step 2: Build Your Complete URI

Replace `<db_password>` with your actual password:

```
mongodb+srv://amarjeet1111_db_user:[YOUR_PASSWORD]@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority
```

Example with password `MyPassword123!`:
```
mongodb+srv://amarjeet1111_db_user:MyPassword123!@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority
```

## Step 3: Add to Railway

1. Go to **https://railway.app/dashboard**
2. Click **Your Project** → **rates-proxy**
3. Click **Settings** (left menu or gear icon)
4. Click **Variables** tab
5. **Add New Variable:**
   - Name: `MONGODB_URI`
   - Value: (paste your complete URI with password)
   - Click **Add**

6. **Add Another Variable:**
   - Name: `MONGODB_DB`
   - Value: `nsheera`
   - Click **Add**

7. Click **Save** (Railway auto-redeploys)

## Step 4: Verify Connection

Wait 3-5 minutes for Railway to rebuild and redeploy.

Check **Deployments tab** → Latest should be 🟢 **GREEN**

Test the connection:

```powershell
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" `
  -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content
```

Should return: `{"status":"ok"}`

## MongoDB Connection String Breakdown

```
mongodb+srv://                           # MongoDB Atlas protocol
amarjeet1111_db_user                     # Username
:MyPassword123!                          # Password (URL encoded if special chars)
@cluster0.wtem0dc.mongodb.net            # MongoDB Atlas cluster URL
/nsheera                                 # Database name
?appName=Cluster0                        # Connection options
&retryWrites=true
&w=majority
```

## Troubleshooting

### "Invalid username/password"
- Wrong password in URI
- Solution: Reset password in MongoDB Atlas → Database Access

### "Cannot connect to cluster"
- IP whitelist issue in MongoDB Atlas
- Solution: Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0 (allow all IPs)

### "Connection timeout"
- MongoDB Atlas cluster not running
- Solution: Check MongoDB Atlas Dashboard → Clusters tab

---

**Do this NOW and let me know when Railway redeploys successfully!**
