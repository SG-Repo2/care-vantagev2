import auth from '@react-native-firebase/auth';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export class GoogleAuthService {
  private static instance: GoogleAuthService;

  private constructor() {
    // Initialize Google Sign-In
    if (Platform.OS === 'ios') {
      // On iOS, we don't need to explicitly provide the client IDs as they are read from GoogleService-Info.plist
      GoogleSignin.configure({});
    } else {
      // On Android, we need the web client ID
      GoogleSignin.configure({
        webClientId: '1071113185455-mpdsi13fffb3o4sqhe64b8vtpiutrqs.apps.googleusercontent.com',
      });
    }
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
