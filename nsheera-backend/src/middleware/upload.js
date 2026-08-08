const fs = require('fs');
const path = require('path');
const multer = require('multer');

const maxSize = (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024;
const uploadRoot = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

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
if (!fs.existsSync(jewelleryDir)) fs.mkdirSync(jewelleryDir, { recursive: true });

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
