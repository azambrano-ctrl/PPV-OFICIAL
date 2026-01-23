
const API_URL = 'http://localhost:5000/api';
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Secret from .env
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

async function testUpload() {
    const filePath = path.join(__dirname, 'test image with spaces.txt');
    fs.writeFileSync(filePath, 'dummy content');

    try {
        // 1. Generate Admin Token
        const token = jwt.sign(
            {
                userId: 'e5a029b5-6f6a-4d2f-9f5f-8d1219e49e6e', // ID from created_by in list_events (assumed admin)
                role: 'admin',
                email: 'admin@tupeleas.com'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Generated Token:', token.substring(0, 20) + '...');

        // 2. Get Event ID
        const listRes = await fetch(`${API_URL}/events`);
        const listData = await listRes.json();

        if (!listData.success || listData.data.length === 0) {
            console.error('No events found to update');
            return;
        }

        const eventId = listData.data[0].id;
        console.log(`Updating event ${eventId}...`);

        // 3. Prepare Upload
        const formData = new FormData();
        formData.append('title', 'Updated via Authenticated Script');

        const fileContent = fs.readFileSync(filePath);
        const blob = new Blob([fileContent], { type: 'text/plain' });
        formData.append('thumbnail', blob, 'test image with spaces.txt');

        // 4. Send PUT with Auth
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        console.log('Response Status:', response.status);
        const text = await response.text();
        console.log('Response Body:', text);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

testUpload();
