import { StyleSheet } from 'react-native';
import { MD3Theme, useTheme } from 'react-native-paper';

const createStyles = (theme: MD3Theme) => StyleSheet.create({
    sharePrompt: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
        color: theme.colors.onSurface,
    },
    shareButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        width: '100%',
        gap: 16,
    },
    shareButton: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: theme.colors.primaryContainer,
    },
    buttonContent: {
        height: '100%',
        width: '100%',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surfaceVariant,
        borderWidth: 1,
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
        color: theme.colors.onSurface,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 16,
        color: theme.colors.onSurfaceVariant,
    },
    points: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.primary,
    },
    star: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        color: theme.colors.primary,
    },
    starIcon: {
        fontSize: 32,
        lineHeight: 32,
        color: theme.colors.primary,
    },
});

export const useStyles = () => {
    const theme = useTheme();
    return createStyles(theme);
};
