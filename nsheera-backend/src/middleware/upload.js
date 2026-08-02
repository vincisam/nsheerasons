const fs = require('fs');
const path = require('path');
const multer = require('multer');

const maxSize = (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024;

// Serverless environments (Vercel/AWS Lambda) only allow writes to /tmp.
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadRoot = isServerless
  ? path.join('/tmp', process.env.UPLOAD_DIR || 'uploads')
  : path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// In-memory upload — used for the AI jewellery-design reference image,
// since that file is only ever forwarded to Gemini and never persisted.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: maxSize },
});

// Disk upload — used for jewellery catalog images that need a stable,
// servable URL (e.g. /uploads/jewellery/<file>.jpg).
const jewelleryDir = path.join(uploadRoot, 'jewellery');
try {
  if (!fs.existsSync(jewelleryDir)) fs.mkdirSync(jewelleryDir, { recursive: true });
} catch (err) {
  console.error('Could not create upload directory (non-fatal):', err.message);
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, jewelleryDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxSize },
});

module.exports = memoryUpload; // default export kept for backward compatibility
module.exports.memoryUpload = memoryUpload;
module.exports.diskUpload = diskUpload;
module.exports.uploadRoot = uploadRoot;
