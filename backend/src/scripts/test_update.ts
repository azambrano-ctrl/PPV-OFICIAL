
import { updateEvent } from '../services/eventService';
import { query } from '../config/database';

async function main() {
    const eventId = '216d6dbb-efe2-4efa-8937-4ebae242205b'; // ID from previous step

    try {
        console.log('Testing updateEvent logic...');

        const updates = {
            title: 'TFL 014 REDENCION - UPDATED',
            stream_url: 'https://test.com/stream.m3u8',
            price: 10.99
        };

        console.log('Applying updates:', updates);

        const event = await updateEvent(eventId, updates);

        console.log('Update successful!');
        console.log('Updated event:', JSON.stringify(event, null, 2));

    } catch (error) {
        console.error('FATAL ERROR during update:', error);

        // Log full error details
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
    }
}

main();
