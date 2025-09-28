import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function getOrCreateDefaultUser() {
  try {
    await connectDB();

    // Try to find any existing user
    let user = await User.findOne({});

    // If no user exists, create a default one
    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      user = await User.create({
        name: 'Default Admin',
        email: 'admin@eaip.com',
        password: hashedPassword,
        role: 'admin',
      });
    }

    return user._id.toString();
  } catch (error) {
    console.error('Error getting or creating default user:', error);
    // Return a default ObjectId format if all else fails
    return '675f1f77bcf86cd799439011';
  }
}