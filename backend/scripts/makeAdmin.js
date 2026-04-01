const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const makeAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOneAndUpdate(
            { email },
            { 
              isAdmin: true,
              role: 'admin' 
            },
            { new: true }
        );
        if (user) {
            console.log(`Success! User ${email} is now an Admin.`);
        } else {
            console.log(`User ${email} not found.`);
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email: node makeAdmin.js your@email.com');
    process.exit();
}

makeAdmin(email);
