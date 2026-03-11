const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function updateCoordinates() {
    try {
        await client.connect();
        const db = client.db('parking_db');
        const collection = db.collection('parkinglots');

        // San Antonio La Paz coordinates: [-90.2866, 14.7592]
        const result = await collection.updateOne(
            { name: 'Campus Central' },
            {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates: [-90.2866, 14.7592]
                    }
                }
            }
        );

        console.log('✅ Coordenadas actualizadas:', result.modifiedCount);

        // Verify
        const lot = await collection.findOne({ name: 'Campus Central' });
        console.log('📍 Ubicación:', lot.location);

    } finally {
        await client.close();
    }
}

updateCoordinates().catch(console.error);
