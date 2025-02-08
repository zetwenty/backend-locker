const axios = require('axios');

const simulateData = async () => {
    const data = {
        lockerId: 1,
        status: 'open',
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await axios.post('http://localhost:3000/api/locker/update', data);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error sending data:', error.message);
    }
};

simulateData();
