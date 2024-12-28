import React from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, useTheme, Avatar, Divider, IconButton } from 'react-native-paper';
import { formatScore } from '../../../core/utils/formatting';
import { DUMMY_DATA, LeaderboardItemProps, ExtendedTheme } from '../types/leaderboard';
import { useStyles } from '../styles/LeaderboardScreen.styles';

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ entry, isUser }) => {
  const theme = useTheme<ExtendedTheme>();
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  // Add null check for entry
  if (!entry) {
    return null;
  }
  
  return (
    <Surface 
      style={[
        styles.itemContainer, 
        isUser && { backgroundColor: theme.colors.primaryContainer }
      ]}
    >
      <View style={styles.mainContent}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: theme.colors.primary }]}>{entry.rank}</Text>
        </View>
        <View style={styles.userInfo}>
          {entry.avatarUrl ? (
            <Avatar.Image 
              size={40} 
              source={{ uri: entry.avatarUrl }} 
            />
          ) : (
            <Avatar.Text
              size={40}
              label={entry.name.charAt(0)}
              color={theme.colors.onPrimary}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <Text style={[styles.name, { marginLeft: 12, color: theme.colors.onSurface }]}>
            {entry.name}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: theme.metrics.score }]}>
            {formatScore(entry.score.overall)}
          </Text>
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            onPress={() => setExpanded(!expanded)}
            iconColor={theme.colors.primary}
          />
        </View>
      </View>
      
      {expanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              Steps
            </Text>
            <Text style={[styles.metricValue, { color: theme.metrics.steps }]}>
              {entry.metrics.steps.toLocaleString()} ({entry.score.categories.steps}pts)
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              Distance
            </Text>
            <Text style={[styles.metricValue, { color: theme.metrics.distance }]}>
              {entry.metrics.distance.toFixed(1)}km ({entry.score.categories.distance}pts)
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              Bonus Points
            </Text>
            <Text style={[styles.metricValue, { color: theme.colors.secondary }]}>
              +{entry.score.bonusPoints}
            </Text>
          </View>
        </View>
      )}
    </Surface>
  );
};

export const LeaderboardScreen: React.FC = () => {
  const theme = useTheme<ExtendedTheme>();
  const styles = useStyles();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.headerContainer, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Leaderboard
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Top Health Champions
        </Text>
      </Surface>
      
      <ScrollView style={styles.scrollView}>
        {(DUMMY_DATA || []).map((entry) => entry && (
          <React.Fragment key={entry.id}>
            <LeaderboardItem
              entry={entry}
              isUser={entry.name === 'You'}
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};
