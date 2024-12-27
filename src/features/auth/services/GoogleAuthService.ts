import auth from '@react-native-firebase/auth';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';

export class GoogleAuthService {
  private static instance: GoogleAuthService;

  private constructor() {
    // Initialize Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID, // web client ID from environment variable
    });
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  public async signIn() {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      await GoogleSignin.signIn();
      
      // Get the tokens
      const { accessToken, idToken } = await GoogleSignin.getTokens();

      // Create a Google credential with the tokens
      const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }

  public async signOut() {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error) {
      console.error('Sign-Out Error:', error);
      throw error;
    }
  }

  public async getCurrentUser() {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        return {
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Get Current User Error:', error);
      throw error;
    }
  }
}

export default GoogleAuthService.getInstance();
