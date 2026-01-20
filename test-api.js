// Test script to verify API is working
const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('Testing POST /api/interested...');
        const response = await fetch('http://localhost:3000/api/interested', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                whatsapp: '+1234567890'
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        // Test GET endpoint
        console.log('\nTesting GET /api/interested...');
        const getResponse = await fetch('http://localhost:3000/api/interested');
        const getData = await getResponse.json();
        console.log('All users:', getData);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAPI();
