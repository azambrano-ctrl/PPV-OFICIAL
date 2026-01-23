
const API_URL = 'http://localhost:5000/api';

async function testFrontendCall() {
    try {
        console.log(`Testing connection to ${API_URL}/events...`);

        // Simulate frontend call
        const response = await fetch(`${API_URL}/events`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);

        const data = await response.json();
        console.log('Data structure keys:', Object.keys(data));

        if (data.success) {
            console.log('Success: true');
            console.log('Events count:', data.data ? data.data.length : 'N/A');
            if (data.data && data.data.length > 0) {
                console.log('Sample event:', data.data[0].title);
            }
        } else {
            console.error('API returned success: false', data);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFrontendCall();
