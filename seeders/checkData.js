const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLot = require('../src/models/ParkingLot');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to DB...');
        const lots = await ParkingLot.find({});
        console.log(`Found ${lots.length} lots.`);
        lots.forEach(lot => {
            console.log(`- ${lot.name}:`, JSON.stringify(lot.location));
        });
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
