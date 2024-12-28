import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useApp } from '../../../context/AppContext';
import { useUser } from '../../../context/UserContext';
import useHealthData from '../../health/hooks/useHealthData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createStyles } from '../styles/LeaderboardScreen.styles';
import { generateMockLeaderboardData } from '../data/mockData';
import { LeaderboardEntry } from '../types/leaderboard';
import { ExtendedTheme } from '../../../theme';

const LeaderboardItem: React.FC<{
  item: LeaderboardEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  theme: ExtendedTheme;
  styles: ReturnType<typeof createStyles>;
}> = ({ item, isExpanded, onToggleExpand, theme, styles }) => {
  const { user } = useUser();
  const isUser = user ? item.id === user.id : false;

  return (
    <View style={[styles.entryContainer, isUser && styles.userEntryContainer]}>
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{item.rank}</Text>
          </View>
          <Image
            source={{ uri: item.avatarUrl }}
            style={styles.avatar}
            defaultSource={require('../../../../assets/favicon.png')}
          />
          <Text style={styles.nameText}>{item.name}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score.overall}</Text>
        </View>
        <TouchableOpacity style={styles.expandButton} onPress={onToggleExpand}>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Steps</Text>
            <Text style={styles.metricValue}>{item.metrics.steps.toLocaleString()}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Distance (km)</Text>
            <Text style={styles.metricValue}>{item.metrics.distance.toFixed(1)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Category Scores</Text>
            <Text style={styles.metricValue}>
              Steps: {item.score.categories.steps} | Distance: {item.score.categories.distance}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Bonus Points</Text>
            <Text style={styles.metricValue}>{item.score.bonusPoints}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const LeaderboardScreen: React.FC = () => {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error] = useState<string | null>(null);

  const { user, isLoading: isUserLoading } = useUser();
  const { metrics, loading: isMetricsLoading } = useHealthData(user?.id || '');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Only show loading on initial load
  const isLoading = !initialLoadComplete && (isUserLoading || isMetricsLoading);

  // Mark initial load as complete after first render
  useEffect(() => {
    if (!isUserLoading && !isMetricsLoading) {
      setInitialLoadComplete(true);
    }
  }, [isUserLoading, isMetricsLoading]);

  // Generate mock data with user's actual data if available, otherwise use default data
  const leaderboardData = useMemo(() => {
    const defaultUserData = {
      id: '1',
      name: 'You',
      avatarUrl: 'https://i.pravatar.cc/150?img=68',
      metrics: {
        steps: 8500,
        distance: 6.5,
      },
      score: 85,
    };

    if (!user || !metrics) {
      return generateMockLeaderboardData(defaultUserData);
    }

    const userData = {
      id: user.id,
      name: user.displayName,
      avatarUrl: user.photoUrl,
      metrics: {
        steps: metrics.steps || 0,
        distance: metrics.distance || 0,
      },
      score: metrics.score || 85,
    };

    return generateMockLeaderboardData(userData);
  }, [user, metrics]);


  const renderItem: ListRenderItem<LeaderboardEntry> = ({ item }) => (
    <LeaderboardItem
      item={item}
      isExpanded={expandedId === item.id}
      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
      theme={theme}
      styles={styles}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboardData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
