# MongoDB Integration for Backend

## What's Been Added

✅ Spring Data MongoDB dependency (pom.xml)
✅ MongoDB connection config (application.properties)
✅ Models: Product, Order, Inquiry, Rate
✅ Repositories for all models

## Deploy with MongoDB Atlas on Railway

### Step 1: Create MongoDB Atlas Cluster (FREE)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a new cluster
4. Wait for cluster to be ready (~2-3 min)
5. Click **Connect**
6. Choose **Drivers**
7. Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### Step 2: Add MongoDB URI to Railway

1. Go to **Railway Dashboard → rates-proxy → Settings → Variables**
2. Add new variable:
   - Name: `MONGODB_URI`
   - Value: (paste your MongoDB Atlas connection string)
3. Add another:
   - Name: `MONGODB_DB`
   - Value: `nsheera`
4. Click **Save**

Railway auto-redeploys (~3-5 min).

### Step 3: Verify MongoDB Connection

Test backend with MongoDB:

```powershell
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" `
  -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content
```

Should return: `{"status":"ok"}`

## New API Endpoints (Coming Soon)

Once deployed, the backend will have:
- `GET /api/products` — List all products
- `POST /api/orders` — Create new order
- `GET /api/orders/{customerId}` — Get customer orders
- `POST /api/inquiries` — Create inquiry
- `GET /api/inquiries` — Get all inquiries

## Local Development

To test locally with MongoDB:

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 mongo

# Run backend
cd rates-proxy
mvn spring-boot:run
```

Backend will connect to local MongoDB on `mongodb://localhost:27017/nsheera`

---

**Next: Set MONGODB_URI on Railway and redeploy!**
