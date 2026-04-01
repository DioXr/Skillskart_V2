const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin123@gmail.com' });
        
        if (user) {
            console.log("-----------------------------------------");
            console.log("DATABASE VERIFICATION SUCCESSFUL ✅");
            console.log("User Found:", user.name);
            console.log("User Email:", user.email);
            console.log("User Role in DB:", user.role);
            console.log("-----------------------------------------");
            
            if (user.role !== 'admin' || !user.isAdmin) {
                console.log("CRITICAL: Permission mismatch! Fixing now...");
                user.role = 'admin';
                user.isAdmin = true;
                await user.save();
                console.log("Role & Admin status corrected to 'admin' 🔥");
            }
        } else {
            console.log("CRITICAL: admin123@gmail.com NOT FOUND! Creating now...");
            await User.create({
                name: 'System Admin',
                email: 'admin123@gmail.com',
                password: 'password123',
                role: 'admin'
            });
            console.log("Admin account created successfully ✅");
        }
        process.exit();
    } catch (e) {
        console.error("Verification error:", e.message);
        process.exit(1);
    }
};

verify();
