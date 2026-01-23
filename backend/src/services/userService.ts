import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../middleware/auth';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin';
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginResponse {
    user: Omit<User, 'password_hash'>;
    accessToken: string;
    refreshToken: string;
}

/**
 * Create a new user
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
    const { email, password, full_name, phone } = input;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
        `INSERT INTO users (email, password_hash, full_name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, phone, role, is_verified, created_at, updated_at`,
        [email, password_hash, full_name, phone]
    );

    return result.rows[0];
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
    const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
    );

    return result.rows[0] || null;
};

/**
 * Verify password
 */
export const verifyPassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Login user
 */
export const loginUser = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
    userId: string,
    updates: Partial<Pick<User, 'full_name' | 'phone'>>
): Promise<User> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.full_name !== undefined) {
        fields.push(`full_name = $${paramCount++}`);
        values.push(updates.full_name);
    }

    if (updates.phone !== undefined) {
        fields.push(`phone = $${paramCount++}`);
        values.push(updates.phone);
    }

    values.push(userId);

    const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
     RETURNING id, email, full_name, phone, role, is_verified, created_at, updated_at`,
        values
    );

    return result.rows[0];
};

/**
 * Change user password
 */
export const changePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const isValid = await verifyPassword(currentPassword, user.password_hash);

    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
    );
};

/**
 * Get user's purchased events
 */
export const getUserPurchases = async (userId: string) => {
    const result = await query(
        `SELECT 
      p.id,
      p.amount,
      p.final_amount,
      p.payment_status,
      p.purchased_at,
      e.id as event_id,
      e.title,
      e.event_date,
      e.status as event_status,
      e.thumbnail_url
    FROM purchases p
    JOIN events e ON p.event_id = e.id
    WHERE p.user_id = $1 AND p.payment_status = 'completed'
    ORDER BY p.purchased_at DESC`,
        [userId]
    );

    return result.rows;
};
