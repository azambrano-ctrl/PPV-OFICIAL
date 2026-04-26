import { generateStreamToken } from './src/middleware/auth';

const userId = 'test-user-id';
const eventId = '19940f3a-a189-40ad-b6e3-9e53eec02fd9';

const token = generateStreamToken(userId, eventId);
console.log('Stream Token:', token);
console.log('\nTest URL:');
console.log(`http://localhost:5000/api/streaming/${eventId}/proxy?token=${token}`);
