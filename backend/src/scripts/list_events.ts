
import { getAllEvents } from '../services/eventService';


async function main() {
    try {
        console.log('Listing events...');
        const events = await getAllEvents();
        console.log('Found events:', events.length);
        if (events.length > 0) {
            console.log('Sample event ID:', events[0].id);
            console.log('Sample event:', JSON.stringify(events[0], null, 2));
        } else {
            console.log('No events found.');
        }
    } catch (error) {
        console.error('Error listing events:', error);
    }
}

main();
