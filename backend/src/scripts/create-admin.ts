import pool from '../config/database';
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        const email = 'admin@ppv.com';
        const password = 'admin123';
        const full_name = 'Administrador';
        const role = 'admin';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log('❌ Admin user already exists!');
            console.log('Email:', email);
            console.log('Password: admin123');
            return;
        }

        // Create admin user
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, full_name, role`,
            [email, hashedPassword, full_name, role]
        );

        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 Name:', full_name);
        console.log('🛡️  Role:', role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login at: http://localhost:3001/admin-auth');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
