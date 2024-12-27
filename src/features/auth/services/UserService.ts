import { getFirestore } from '../../../config/firebase';
import { User } from '../types/auth';

class UserService {
  private collection = 'users';

  async createUser(user: User): Promise<void> {
    try {
      const db = getFirestore();
      await db.collection(this.collection).doc(user.id).set({
        email: user.email,
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const db = getFirestore();
      await db.collection(this.collection).doc(userId).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const db = getFirestore();
      const doc = await db.collection(this.collection).doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      return {
        id: doc.id,
        email: data?.email || '',
        displayName: data?.displayName,
      };
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const db = getFirestore();
      await db.collection(this.collection).doc(userId).delete();
    } catch (error) {
      console.error('Error deleting user from Firestore:', error);
      throw error;
    }
  }
}

export default new UserService();
