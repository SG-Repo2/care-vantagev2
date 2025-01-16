export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 