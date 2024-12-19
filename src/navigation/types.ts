export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  MetricDetail: {
    metricType: 'steps' | 'distance' | 'score';
    title: string;
  };
  Profile: undefined;
};
