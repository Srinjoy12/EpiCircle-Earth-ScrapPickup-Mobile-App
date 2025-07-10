import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PickupRequest } from '../../types';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';

interface CustomerDashboardProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ navigation }) => {
  const { authState, logout } = useAuth();
  const { dataState, getPickupRequestsByCustomer, refreshData, approvePickup } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PickupRequest | null>(null);
  const [isApprovalModalVisible, setApprovalModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
        return Colors.info;
      case 'in-process':
        return Colors.secondary;
      case 'pending-approval':
        return Colors.earth;
      case 'completed':
        return Colors.success;
      default:
        return Colors.gray[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'in-process':
        return 'In Process';
      case 'pending-approval':
        return 'Pending Approval';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'in-process':
        return 'car-outline';
      case 'pending-approval':
        return 'scale-outline';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'document-outline';
    }
  };

  const handleApproveOrder = async () => {
    if (selectedOrder) {
      try {
        await approvePickup(selectedOrder.id);
        setApprovalModalVisible(false);
        setSelectedOrder(null);
        Alert.alert('Success', 'Pickup approved successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to approve pickup. Please try again.');
      }
    }
  };

  const openApprovalModal = (order: PickupRequest) => {
    setSelectedOrder(order);
    setApprovalModalVisible(true);
  };

  const renderApprovalModal = () => {
    if (!selectedOrder) return null;

    const totalWeight = selectedOrder.items?.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 0), 0) || 0;
    const totalAmount = selectedOrder.totalAmount || 0;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isApprovalModalVisible}
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Approval</Text>
              <TouchableOpacity onPress={() => setApprovalModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Address:</Text>
                <Text style={styles.addressText}>{selectedOrder.address}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Collected Items</Text>
                {selectedOrder.items?.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.itemValues}>
                      <Text style={styles.itemQuantity}>{item.quantity} kg</Text>
                      <Text style={styles.itemPrice}>₹{item.price}/kg</Text>
                      <Text style={styles.itemTotal}>₹{(item.quantity * item.price).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              
              <View style={styles.summaryContainer}>
                <View>
                  <Text style={styles.summaryLabel}>Total Weight:</Text>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                </View>
                <View>
                  <Text style={styles.summaryValue}>{totalWeight.toFixed(1)} kg</Text>
                  <Text style={styles.summaryValueAmount}>₹{totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.declineButton]}>
                 <Text style={[styles.modalButtonText, {color: Colors.danger}]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.approveButtonModal]} onPress={handleApproveOrder}>
                <Text style={styles.modalButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  const QuickStatsCard = ({ title, value, subtitle, trend, isActive, totalCount, index }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    trend: string;
    isActive?: boolean;
    totalCount: number;
    index: number;
  }) => {
    const [cardScale] = useState(new Animated.Value(0.95));
    const [cardOpacity] = useState(new Animated.Value(0));
    const [progressAnimations] = useState(
      Array.from({ length: totalCount }, () => new Animated.Value(0))
    );
    const [pulseAnim] = useState(new Animated.Value(1));
    const [shimmerAnim] = useState(new Animated.Value(0));
    const [floatAnim] = useState(new Animated.Value(0));

    useEffect(() => {
      // Card entrance animation with staggered delay
      const delay = index * 150;
      
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Progress bars animation after card appears
        const progressDelays = Array.from({ length: totalCount }, (_, i) => i * 50);
        
        Animated.stagger(
          50,
          progressAnimations.map((anim, i) =>
            Animated.spring(anim, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            })
          )
        ).start();
      });

      // Pulse animation for active indicator
      if (isActive) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Shimmer effect for progress bars
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000 + index * 500, // Different timing for each card
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const shimmerTranslateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });

    const floatTranslateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -3],
    });

    // Define gradient colors based on card index
    const getGradientColors = () => {
      switch (index) {
        case 0: // Total Orders - Mint Green Gradient
          return ['#F0FDF4', '#DCFCE7', '#BBF7D0'];
        case 1: // Active Pickups - Coral Orange Gradient  
          return ['#FFF7ED', '#FFEDD5', '#FED7AA'];
        case 2: // Completed - Light Blue Gradient
          return ['#F0F9FF', '#E0F2FE', '#BAE6FD'];
        default:
          return ['#FFFFFF', '#F9FAFB', '#F3F4F6'];
      }
    };

    const getTextColors = () => {
      switch (index) {
        case 0: // Total Orders - Darker greens for contrast
          return {
            title: '#065F46',
            value: '#064E3B', 
            subtitle: '#047857',
            trend: '#059669'
          };
        case 1: // Active Pickups - Darker oranges
          return {
            title: '#9A3412',
            value: '#7C2D12',
            subtitle: '#C2410C', 
            trend: '#EA580C'
          };
        case 2: // Completed - Darker blues
          return {
            title: '#1E3A8A',
            value: '#1E40AF',
            subtitle: '#2563EB',
            trend: '#3B82F6'
          };
        default:
          return {
            title: '#374151',
            value: '#111827',
            subtitle: '#9CA3AF',
            trend: '#10B981'
          };
      }
    };

    const gradientColors = getGradientColors();
    const textColors = getTextColors();

    return (
      <Animated.View style={[
        styles.statsCard,
        {
          opacity: cardOpacity,
          transform: [
            { scale: cardScale },
            { translateY: floatTranslateY },
          ],
        }
      ]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardContent}>
            {/* Shimmer overlay */}
            <Animated.View style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              }
            ]}>
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            
            {/* Header */}
            <View style={styles.statsHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.statsTitle, { color: textColors.title }]}>{title}</Text>
                {isActive && (
                  <Animated.View style={[
                    styles.activeIndicator,
                    { 
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: textColors.trend
                    }
                  ]} />
                )}
              </View>
              <TouchableOpacity style={[styles.infoButton, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={textColors.subtitle} />
              </TouchableOpacity>
            </View>
            
            {/* Main Metric */}
            <View style={styles.metricContainer}>
              <View style={styles.valueRow}>
                <Text style={[styles.statsValue, { color: textColors.value }]}>{value}</Text>
                <Text style={[styles.statsSubtitle, { color: textColors.subtitle }]}>{subtitle}</Text>
              </View>
            </View>
            
            {/* Progress Bars */}
            <View style={styles.progressContainer}>
              {Array.from({ length: totalCount }).map((_, barIndex) => (
                <Animated.View 
                  key={barIndex}
                  style={[
                    styles.progressBar,
                    { 
                      backgroundColor: barIndex < parseInt(value) ? textColors.trend : 'rgba(255,255,255,0.5)',
                      transform: [{ scaleY: progressAnimations[barIndex] }],
                    }
                  ]} 
                />
              ))}
            </View>
            
            {/* Trend */}
            <View style={styles.trendContainer}>
              <Ionicons name="trending-up" size={12} color={textColors.trend} />
              <Text style={[styles.trendText, { color: textColors.subtitle }]}>{trend}</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const ActionButton = ({ iconName, title, subtitle, onPress, color }: { 
    iconName: string; 
    title: string; 
    subtitle: string; 
    onPress: () => void; 
    color: string;
  }) => {
    const [buttonScale] = useState(new Animated.Value(1));
    const [iconRotate] = useState(new Animated.Value(0));

    const handlePress = () => {
      // Scale animation on press
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.96,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon rotation animation
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        iconRotate.setValue(0);
      });

      onPress();
    };

    const iconRotateInterpolation = iconRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '10deg'],
    });

    return (
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePress} activeOpacity={0.8}>
          <Animated.View style={[
            styles.actionIcon, 
            { 
              backgroundColor: color + '20',
              transform: [{ rotate: iconRotateInterpolation }],
            }
          ]}>
            <Ionicons name={iconName as any} size={24} color={color} />
          </Animated.View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const allOrders = authState.user ? getPickupRequestsByCustomer(authState.user.id) : [];
  const recentOrders = allOrders.slice(-3).reverse();
  const totalOrders = allOrders.length;
  const activeOrders = allOrders.filter(o => o.status === 'accepted' || o.status === 'in-process').length;
  const completedOrders = allOrders.filter(o => o.status === 'completed').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <View style={styles.welcomeContainer}>
                <Ionicons name="leaf-outline" size={24} color={Colors.primary} />
                <Text style={styles.greeting}>Welcome to EpiCircle!</Text>
              </View>
              <Text style={styles.phoneText}>{authState.user?.phoneNumber}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={logout}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.tagline}>Turn your scrap into treasure</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Impact</Text>
            <Animated.View style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}>
              <QuickStatsCard
                title="Total Orders"
                value={totalOrders.toString()}
                subtitle="Requests"
                trend="+2 from last month"
                isActive={true}
                totalCount={17}
                index={0}
              />
              
              <QuickStatsCard
                title="Active Pickups"
                value={activeOrders.toString()}
                subtitle="In Progress"
                trend="+1 this week"
                isActive={true}
                totalCount={17}
                index={1}
              />
              
              <QuickStatsCard
                title="Completed"
                value={completedOrders.toString()}
                subtitle="Finished"
                trend="+3 last week"
                isActive={false}
                totalCount={17}
                index={2}
              />
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <ActionButton
                iconName="calendar-outline"
                title="Schedule Pickup"
                subtitle="Book a new scrap collection"
                onPress={() => navigation.navigate('SchedulePickup')}
                color={Colors.primary}
              />
              <ActionButton
                iconName="list-outline"
                title="Order History"
                subtitle="View all your pickups"
                onPress={() => navigation.navigate('OrderHistory')}
                color={Colors.info}
              />
              <ActionButton
                iconName="wallet-outline"
                title="Earnings"
                subtitle="Track your treasure earnings"
                onPress={() => navigation.navigate('OrderHistory')}
                color={Colors.gold}
              />
            </View>
          </View>

          {/* Recent Orders */}
          <View style={styles.recentOrdersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {recentOrders.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {recentOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons name="leaf-outline" size={48} color={Colors.primary} />
                </View>
                <Text style={styles.emptyStateTitle}>No orders yet</Text>
                <Text style={styles.emptyStateText}>
                  Ready to start your eco-journey? Schedule your first pickup and turn scrap into treasure!
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('SchedulePickup')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color={Colors.white} />
                  <Text style={styles.emptyStateButtonText}>Schedule First Pickup</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ordersContainer}>
                {recentOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderInfo}>
                        <View style={styles.orderDateContainer}>
                          <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
                          <Text style={styles.orderDate}>{order.pickupDate}</Text>
                        </View>
                        <View style={styles.orderTimeContainer}>
                          <Ionicons name="time" size={16} color={Colors.textSecondary} />
                          <Text style={styles.orderTime}>{order.timeSlot}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Ionicons 
                          name={getStatusIcon(order.status) as any} 
                          size={14} 
                          color={Colors.white} 
                        />
                        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                      </View>
                    </View>
                    <View style={styles.orderAddressContainer}>
                      <Ionicons name="location" size={16} color={Colors.textSecondary} />
                      <Text style={styles.orderAddress} numberOfLines={2}>
                        {order.address}
                      </Text>
                    </View>
                    {order.pickupCode && ['accepted', 'in-process'].includes(order.status) && (
                      <View style={styles.pickupCodeContainer}>
                        <Ionicons name="key-outline" size={16} color={Colors.primary} />
                        <Text style={styles.pickupCodeLabel}>Your Pickup Code:</Text>
                        <Text style={styles.pickupCode}>{order.pickupCode}</Text>
                      </View>
                    )}
                    {order.status === 'pending-approval' && (
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => openApprovalModal(order)}
                      >
                        <Text style={styles.approveButtonText}>Approve Items</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Eco Tips</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb-outline" size={24} color={Colors.gold} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Separate Your Scrap</Text>
                <Text style={styles.tipText}>
                  Clean and separate different materials (paper, plastic, metal) for better pricing!
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {renderApprovalModal()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greeting: {
    ...Typography.styles.title2,
    color: Colors.textPrimary,
  },
  phoneText: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
  },
  tagline: {
    ...Typography.styles.footnote,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.styles.title3,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    ...Typography.styles.footnote,
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 4,
  },
  statsCard: {
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 120,
    height: '100%',
    opacity: 0.9,
    zIndex: 1,
    borderRadius: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContainer: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  statsSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  actionSubtitle: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  recentOrdersSection: {
    marginBottom: 32,
  },
  emptyState: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  emptyStateTitle: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.white,
  },
  ordersContainer: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderDate: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
  },
  orderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTime: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  orderAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  orderAddress: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  
  statusText: {
    ...Typography.styles.caption1,
    color: Colors.white,
    fontWeight: '600',
  },
  pickupCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  pickupCodeLabel: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  pickupCode: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.primary,
  },
  approveButton: {
    backgroundColor: Colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  approveButtonText: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Typography.styles.heading,
    fontSize: 24,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    ...Typography.styles.subheading,
    marginBottom: 10,
    color: Colors.textSecondary,
  },
  addressText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemName: {
    ...Typography.styles.bodyEmphasized,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  itemCategory: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemValues: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  itemPrice: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  itemTotal: {
    ...Typography.styles.bodyEmphasized,
    fontSize: 18,
    color: Colors.success,
  },
  summaryContainer: {
    backgroundColor: 'rgba(56, 161, 105, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  summaryLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  summaryValue: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  summaryValueAmount: {
    ...Typography.styles.heading,
    fontSize: 22,
    color: Colors.success,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: Colors.gray[200],
    marginRight: 10,
  },
  approveButtonModal: {
    backgroundColor: Colors.success,
    marginLeft: 10,
  },
  modalButtonText: {
    ...Typography.styles.bodyEmphasized,
    fontSize: 18,
    color: Colors.white,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: Colors.gold + '20',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    gap: 16,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tipText: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
}); 