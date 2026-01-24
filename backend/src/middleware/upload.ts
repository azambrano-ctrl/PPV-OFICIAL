const multer = require('multer');
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
        cb(null, uploadsDir);
    },
    filename: (_req: any, file: any, cb: any) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // Sanitize filename: remove spaces, keep only nice chars
        const nameWithoutExt = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric with hyphen
            .replace(/-+/g, '-') // Replace multiple hyphens with single one
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
    }
};

// Create multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // Default 50MB
    }
});

// Middleware for event images (thumbnail and banner)
export const uploadEventImages = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

// Middleware for settings images (homepage background)
export const uploadSettingsImages = upload.fields([
    { name: 'homepage_background', maxCount: 1 }
]);
