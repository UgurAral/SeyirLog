import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TABS: TabConfig[] = [
  {
    name: 'index',
    title: 'Ana Sayfa',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'trips',
    title: 'Seferler',
    icon: 'navigate-circle-outline',
    iconFocused: 'navigate-circle',
  },
  {
    name: 'fuel',
    title: 'Yakıt',
    icon: 'flame-outline',
    iconFocused: 'flame',
  },
  {
    name: 'finans',
    title: 'Finans',
    icon: 'swap-vertical-outline',
    iconFocused: 'swap-vertical',
  },
  {
    name: 'profile',
    title: 'Araç & Profil',
    icon: 'car-outline',
    iconFocused: 'car',
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#F1F5F9',
        headerTitleStyle: { fontWeight: '700' },
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
