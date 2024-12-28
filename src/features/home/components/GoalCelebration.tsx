import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Animated, Share, Platform } from 'react-native';
import { Surface, Text, useTheme, Button } from 'react-native-paper';
interface GoalCelebrationProps {
  visible: boolean;
  onClose: () => void;
  bonusPoints: number;
}

const GoalCelebration: React.FC<GoalCelebrationProps> = ({
  visible,
  onClose,
  bonusPoints,
}) => {
  const theme = useTheme();
  const scale = new Animated.Value(0.5);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Reset animation values
      scale.setValue(0.5);
      opacity.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

    }
  }, [visible, scale, opacity, onClose]);

  if (!visible) return null;

  const handleShare = async (platform: string) => {
    const message = "I just reached my daily step goal! 🎉 Join me on my fitness journey!";
    const url = "https://yourapp.com/signup";
    
    try {
      if (Platform.OS === 'web') {
        // Web-specific sharing
        let shareUrl = '';
        switch (platform) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
            break;
          case 'instagram':
            shareUrl = 'https://instagram.com';
            break;
        }
        window.open(shareUrl, '_blank');
      } else {
        // Native sharing
        await Share.share({
          message: `${message}\n${url}`,
          url: url, // iOS only
          title: 'Share Goal Achievement',
        });
      }
      
      // Close celebration after successful share
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Surface
            style={[
              styles.surface,
              {
                backgroundColor: theme.dark
                  ? theme.colors.surfaceVariant
                  : theme.colors.surface,
              },
            ]}
          >
            <View style={styles.starsContainer}>
              {[...Array(3)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.starContainer,
                    {
                      transform: [
                        {
                          translateY: new Animated.Value(0).interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -10],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={[styles.star, { marginHorizontal: 4 }]}>
                    <Text style={[styles.starIcon, { color: theme.colors.primary }]}>
                      ★
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Congratulations!
            </Text>

            <Text
              variant="titleMedium"
              style={[styles.subtitle, { color: theme.colors.onSurface }]}
            >
              You've reached your daily step goal!
            </Text>

            <Text
              variant="titleLarge"
              style={[styles.points, { color: theme.colors.primary }]}
            >
              +{bonusPoints} Bonus Points Earned!
            </Text>

            <Text
              variant="bodyMedium"
              style={[styles.sharePrompt, { color: theme.colors.onSurfaceVariant }]}
            >
              Share your achievement to continue
            </Text>

            <View style={styles.shareButtonsContainer}>
              <Button
                mode="contained"
                onPress={() => handleShare('facebook')}
                style={[styles.shareButton, { backgroundColor: '#1877F2' }]}
                labelStyle={styles.shareButtonLabel}
              >
                Facebook
              </Button>
              <Button
                mode="contained"
                onPress={() => handleShare('twitter')}
                style={[styles.shareButton, { backgroundColor: '#1DA1F2' }]}
                labelStyle={styles.shareButtonLabel}
              >
                Twitter
              </Button>
              <Button
                mode="contained"
                onPress={() => handleShare('instagram')}
                style={[styles.shareButton, { backgroundColor: '#E4405F' }]}
                labelStyle={styles.shareButtonLabel}
              >
                Instagram
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sharePrompt: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
    width: '100%',
  },
  shareButton: {
    marginHorizontal: 4,
    minWidth: 100,
    borderRadius: 8,
  },
  shareButtonLabel: {
    fontSize: 12,
    color: 'white',
    paddingVertical: 4,
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
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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

export default GoalCelebration;
