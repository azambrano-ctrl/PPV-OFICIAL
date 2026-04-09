import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 client (S3-compatible)
const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT, // https://<account_id>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // https://cdn.tudominio.com or public R2 URL

// Multer: store temp files in /tmp to avoid RAM issues on Render (512MB)
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, '/tmp'),
});

const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedImageMimes.includes(file.mimetype) || allowedVideoMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and MP4/WebM videos are allowed.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    },
});

// Upload a single file to Cloudflare R2
const uploadToR2 = async (file: any): Promise<{ publicUrl: string; filename: string }> => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const filename = `uploads/${nameWithoutExt}-${uniqueSuffix}${ext}`;

    try {
        const fileBuffer = fs.readFileSync(file.path);

        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: filename,
            Body: fileBuffer,
            ContentType: file.mimetype,
        }));

        const publicUrl = `${R2_PUBLIC_URL}/${filename}`;
        return { publicUrl, filename };
    } finally {
        // Always clean up temp file
        try { fs.unlinkSync(file.path); } catch (_) {}
    }
};

// Middleware wrapper: multer + R2 upload
export const handleUploads = (fields: { name: string; maxCount?: number }[]) => {
    const multerUpload = upload.fields(fields);

    return (req: Request, res: Response, next: NextFunction) => {
        multerUpload(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error',
                });
            }

            const request = req as any;
            if (!request.files || Object.keys(request.files).length === 0) {
                return next();
            }

            try {
                const files = request.files as { [fieldname: string]: any[] };
                const uploadPromises = Object.values(files).flat().map(async (file) => {
                    const { publicUrl, filename } = await uploadToR2(file);
                    file.filename = filename;
                    file.path = publicUrl;
                    file.location = publicUrl;
                });

                await Promise.all(uploadPromises);
                next();
            } catch (uploadError: any) {
                console.error('R2 upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload files to storage',
                });
            }
        });
    };
};

// Named middleware exports (same API as before — routes don't need changes)
export const uploadEventImages = handleUploads([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
]);

export const uploadTrailerVideo = handleUploads([
    { name: 'trailer_video', maxCount: 1 },
]);

export const uploadSettingsImages = handleUploads([
    { name: 'homepage_background', maxCount: 1 },
    { name: 'homepage_video', maxCount: 1 },
    { name: 'homepage_slider', maxCount: 10 },
    { name: 'about_background', maxCount: 1 },
    { name: 'about_gallery', maxCount: 10 },
    { name: 'about_history_image_1', maxCount: 1 },
    { name: 'about_history_image_2', maxCount: 1 },
    { name: 'about_history_image_3', maxCount: 1 },
    { name: 'site_logo', maxCount: 1 },
    { name: 'site_favicon', maxCount: 1 },
    { name: 'login_background_url', maxCount: 1 },
    { name: 'login_background_video', maxCount: 1 },
    { name: 'sponsor_image', maxCount: 1 },
]);

export const uploadPromoterImages = [
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
];

export const uploadFighterImages = handleUploads([
    { name: 'profile_image_url', maxCount: 1 },
    { name: 'banner_image_url', maxCount: 1 },
]);
