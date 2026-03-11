const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to DB...');

        const email = 'carlos.lopez@estudiante.umg.edu.gt';
        const newPassword = 'Student@12345';

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found!');
        } else {
            // Update password manually to trigger pre-save hook if implemented like that, 
            // or just set it. 
            // In Mongoose, if we set the field and save(), the pre-save hook should run.
            user.password = newPassword;
            await user.save();
            console.log(`Password for ${email} updated successfully!`);
        }

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
