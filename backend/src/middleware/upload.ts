import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { supabase, BUCKET_NAME } from '../config/supabase';

// Configure multer to store files in the OS temp directory
// This prevents loading large files into RAM on memory-constrained environments like Render (512MB)
const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
        cb(null, '/tmp');
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

import fs from 'fs';

// Helper function to upload file to Supabase
const uploadToSupabase = async (file: any): Promise<{ publicUrl: string; filename: string }> => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const filename = `${nameWithoutExt}-${uniqueSuffix}${ext}`;

    try {
        // Read file from disk
        const fileContent = fs.readFileSync(file.path);

        // Upload to Supabase
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, fileContent, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw new Error(`Supabase upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);

        // Cleanup: remove temporary file from disk
        try {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Temporary file deleted: ${file.path}`);
        } catch (unlinkError) {
            console.warn(`⚠️ Failed to delete temporary file: ${file.path}`, unlinkError);
        }

        return { publicUrl: publicUrlData.publicUrl, filename };
    } catch (error) {
        // Ensure cleanup even on failure
        if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) { }
        }
        throw error;
    }
};

// Middleware wrapper to handle uploads and Supabase transfer
export const handleUploads = (fields: { name: string; maxCount?: number }[]) => {
    const multerUpload = upload.fields(fields);

    return (req: Request, res: Response, next: NextFunction) => {
        multerUpload(req, res, async (err: any) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            }

            // Cast req to any to access files without TS errors
            const request = req as any;

            // If no files, skip
            if (!request.files || Object.keys(request.files).length === 0) {
                return next();
            }

            try {
                const files = request.files as { [fieldname: string]: any[] };
                console.log('📂 [Middleware] Processing files for fields:', Object.keys(files));
                const totalFiles = Object.values(files).reduce((acc, val) => acc + val.length, 0);
                console.log(`📂 [Middleware] Total files to upload to Supabase: ${totalFiles}`);

                // Iterate over all files and upload to Supabase
                const uploadPromises = Object.keys(files).flatMap(fieldName => {
                    return files[fieldName].map(async (file) => {
                        const { publicUrl, filename } = await uploadToSupabase(file);
                        // Modify the file object to include the public URL as path/filename
                        // We use 'filename' property to store the simple name if needed, 
                        // but ideally we want the FULL URL to be easily accessible.
                        // Existing code uses /uploads/${filename}. 

                        // Let's attach the URL to a new property 'publicUrl' AND hacks 'filename' to be usable.
                        // Strategy: Store the full URL in 'path' (usually local path) and 'destination'.
                        // And for compatibility with existing routes that might prepend /uploads/, 
                        // we'll need to update the routes to NOT prepend it.

                        file.filename = filename; // Set filename for compatibility
                        file.path = publicUrl;
                        file.destination = BUCKET_NAME;
                        (file as any).location = publicUrl; // Common in S3 multer
                        return file;
                    });
                });

                await Promise.all(uploadPromises);
                next();
            } catch (uploadError: any) {
                console.error('Supabase upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload files to storage',
                    error: uploadError.message
                });
            }
        });
    };
};

// Middleware for event images (thumbnail and banner)
export const uploadEventImages = handleUploads([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

// Middleware for settings images (homepage_background)
export const uploadSettingsImages = handleUploads([
    { name: 'homepage_background', maxCount: 1 },
    { name: 'about_background', maxCount: 1 },
    { name: 'about_gallery', maxCount: 10 },
    { name: 'site_logo', maxCount: 1 },
    { name: 'site_favicon', maxCount: 1 }
]);

// Promoter image fields definition
export const uploadPromoterImages = [
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
];
