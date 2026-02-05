import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NewsService } from '../services/newsService';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    content: z.string().min(20, 'Content must be at least 20 characters'),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    thumbnail_url: z.string().url('Invalid thumbnail URL').optional().or(z.literal('')),
    banner_url: z.string().url('Invalid banner URL').optional().or(z.literal('')),
    status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
    scheduled_for: z.string().datetime().optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    is_featured: z.boolean().default(false),
});

const updatePostSchema = createPostSchema.partial();

/**
 * GET /api/news
 * List news posts
 */
router.get(
    '/',
    asyncHandler(async (req: any, res: Response) => {
        const { status, category, featured, limit, offset } = req.query;

        const posts = await NewsService.getAllPosts({
            status: status as string,
            category: category as string,
            featured: featured === 'true',
            limit: limit ? parseInt(limit as string) : 20,
            offset: offset ? parseInt(offset as string) : 0,
        });

        res.json({
            success: true,
            data: posts,
        });
    })
);

/**
 * GET /api/news/:slug
 * Get single post by slug
 */
router.get(
    '/:slug',
    asyncHandler(async (req: any, res: Response) => {
        const post = await NewsService.getPostBySlug(req.params.slug);

        if (!post) {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            });
            return;
        }

        res.json({
            success: true,
            data: post,
        });
    })
);

/**
 * POST /api/news
 * Create news post (Admin only)
 */
router.post(
    '/',
    authenticate,
    validateBody(createPostSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Only admins can create posts
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }

        const post = await NewsService.createPost({
            ...req.body,
            author_id: req.user!.userId,
        });

        res.status(201).json({
            success: true,
            data: post,
        });
    })
);

/**
 * PUT /api/news/:id
 * Update news post (Admin only)
 */
router.put(
    '/:id',
    authenticate,
    validateBody(updatePostSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Only admins can update posts
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }

        const post = await NewsService.updatePost(req.params.id, req.body);

        res.json({
            success: true,
            data: post,
        });
    })
);

/**
 * DELETE /api/news/:id
 * Delete news post (Admin only)
 */
router.delete(
    '/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Only admins can delete posts
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }

        await NewsService.deletePost(req.params.id);

        res.json({
            success: true,
            message: 'Post deleted successfully',
        });
    })
);

export default router;
