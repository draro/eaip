import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function getOrCreateDefaultUser() {
  try {
    await connectDB();

    // Try to find an existing super admin user
    let user = await User.findOne({ role: 'super_admin' });

    // If no super admin exists, create a default one
    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      user = await User.create({
        name: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@eaip.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      });
      console.log('Created default super admin user:', user._id);
    }

    return user._id.toString();
  } catch (error) {
    console.error('Error getting or creating default user:', error);
    throw error; // Throw the error so we can handle it in the calling function
  }
}