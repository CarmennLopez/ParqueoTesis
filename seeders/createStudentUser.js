const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to DB...');

        const email = 'carlos.lopez@estudiante.umg.edu.gt';
        const password = 'Student@12345';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User found, updating password...');
            user.password = password;
            await user.save();
            console.log('Password updated.');
        } else {
            console.log('User not found, creating...');
            user = new User({
                name: 'Carlos López Estudiante',
                email: email,
                password: password,
                cardId: 'STU001',
                vehiclePlate: 'STU0001',
                role: 'student',
                nit: 'CF'
            });
            await user.save();
            console.log('User created successfully.');
        }

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
