import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    sharePrompt: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    shareButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Changed back to center for better centering
        alignItems: 'center',
        marginTop: 24,
        width: '100%',
        gap: 16, // Added gap for even spacing between buttons
    },
    shareButton: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center', // Added for better centering
    },
    buttonContent: {
        height: '100%', // Changed to percentage
        width: '100%', // Changed to percentage
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginLeft: 15,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    contentContainer: {
        width: '80%',
        maxWidth: 400,
        alignItems: 'center',
    },
    surface: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
        width: '100%',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        justifyContent: 'center',
    },
    starContainer: {
        padding: 4,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 16,
    },
    points: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    star: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    starIcon: {
        fontSize: 32,
        lineHeight: 32,
    },
});
