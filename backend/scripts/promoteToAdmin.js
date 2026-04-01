const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const promoteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find the admin user by email (adjust as needed)
        const email = 'admin123@gmail.com'; 
        const user = await User.findOne({ email });

        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully promoted ${email} to admin role! 🛡️`);
        } else {
            console.log(`User with email ${email} not found.`);
        }
        
        process.exit();
    } catch (error) {
        console.error('Error promoting user:', error.message);
        process.exit(1);
    }
};

promoteUser();
