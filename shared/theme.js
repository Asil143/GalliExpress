// GalliExpress — Shared Theme
// Used across Customer, Partner & Rider apps

export const Colors = {
  primary: '#FF6B35',       // Energetic orange — GalliExpress brand
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',
  secondary: '#FFB800',     // Golden yellow — Telugu festive feel
  secondaryLight: '#FFD055',

  success: '#00C851',
  successLight: '#E6F9ED',
  error: '#FF3B30',
  errorLight: '#FFF0EF',
  warning: '#FF9500',
  warningLight: '#FFF5E6',

  dark: '#1C1C2E',
  darkGrey: '#3D3D4E',
  grey: '#8A8A99',
  lightGrey: '#C8C8D4',
  border: '#EBEBF0',
  background: '#F7F7FA',
  card: '#FFFFFF',
  white: '#FFFFFF',

  // Status colors
  pending: '#FFB800',
  confirmed: '#007AFF',
  preparing: '#FF6B35',
  ready: '#00C851',
  onTheWay: '#5856D6',
  delivered: '#00C851',
  cancelled: '#FF3B30',
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    huge: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const UserType = {
  CUSTOMER: 'customer',
  PARTNER: 'partner',
  RIDER: 'rider',
};
