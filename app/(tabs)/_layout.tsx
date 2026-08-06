import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

export default function TabsLayout() {
  const { t } = useTranslation();

  const TABS: TabConfig[] = [
    {
      name: 'index',
      title: t('tabs.home'),
      icon: 'home-outline',
      iconFocused: 'home',
    },
    {
      name: 'trips',
      title: t('tabs.trips'),
      icon: 'navigate-circle-outline',
      iconFocused: 'navigate-circle',
    },
    {
      name: 'fuel',
      title: t('tabs.fuel'),
      icon: 'flame-outline',
      iconFocused: 'flame',
    },
    {
      name: 'finans',
      title: t('tabs.finans'),
      icon: 'swap-vertical-outline',
      iconFocused: 'swap-vertical',
    },
    {
      name: 'profile',
      title: t('tabs.profile'),
      icon: 'car-outline',
      iconFocused: 'car',
    },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
