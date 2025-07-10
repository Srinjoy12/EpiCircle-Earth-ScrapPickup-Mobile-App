import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PickupRequest, PickupItem } from '../../types';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const PartnerDashboard: React.FC = () => {
  const { authState, logout } = useAuth();
  const {
    dataState,
    getAvailablePickups,
    getPickupRequestsByPartner,
    acceptPickupRequest,
    startPickup,
    addItems,
    refreshData,
  } = useData();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [showPickupCodeModal, setShowPickupCodeModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [items, setItems] = useState<PickupItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '' });
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

  const getCompletedPickupsCount = (pickups: PickupRequest[]) => {
    return pickups.filter(p => p.status === 'completed').length;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAcceptPickup = async (pickupId: string) => {
    if (!authState.user) return;

    try {
      await acceptPickupRequest(pickupId, authState.user.id, authState.user.name, authState.user.phoneNumber);
      Alert.alert('Success', 'Pickup request accepted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept pickup request. Please try again.');
    }
  };

  const handleStartPickup = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setShowPickupCodeModal(true);
  };

  const handleVerifyPickupCode = async () => {
    if (!selectedPickup || !pickupCode.trim()) {
      Alert.alert('Error', 'Please enter the pickup code');
      return;
    }

    try {
      const success = await startPickup(selectedPickup.id, pickupCode.trim());
      if (success) {
        setShowPickupCodeModal(false);
        setPickupCode('');
        Alert.alert('Success', 'Pickup started successfully!');
      } else {
        Alert.alert('Error', 'Invalid pickup code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start pickup. Please try again.');
    }
  };

  const handleAddItems = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setItems([]);
    setNewItem({ name: '', quantity: '', price: '' });
    setShowItemsModal(true);
  };

  const handleAddNewItem = () => {
    if (!newItem.name.trim() || !newItem.quantity || !newItem.price) {
      Alert.alert('Error', 'Please fill all item details');
      return;
    }

    const item: PickupItem = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      quantity: parseInt(newItem.quantity),
      price: parseFloat(newItem.price),
    };

    setItems([...items, item]);
    setNewItem({ name: '', quantity: '', price: '' });
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmitItems = async () => {
    if (!selectedPickup || items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

    try {
      await addItems(selectedPickup.id, items, totalAmount);
      setShowItemsModal(false);
      setItems([]);
      Alert.alert('Success', 'Items submitted for customer approval!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit items. Please try again.');
    }
  };

  const getActionProps = (pickup: PickupRequest) => {
    switch (pickup.status) {
      case 'pending':
        return {
          actionLabel: 'Accept Pickup',
          onAction: () => handleAcceptPickup(pickup.id),
          actionColor: Colors.success,
        };
      case 'accepted':
        return {
          actionLabel: 'Start Pickup',
          onAction: () => handleStartPickup(pickup),
          actionColor: Colors.info,
        };
      case 'in-process':
        return {
          actionLabel: 'Add Items & Complete',
          onAction: () => handleAddItems(pickup),
          actionColor: Colors.warning,
        };
      default:
        return {};
    }
  };

  const cardColors = [
    {
      gradient: ['#F0FDF4', '#DCFCE7', '#BBF7D0'],
      text: { title: '#065F46', value: '#064E3B', subtitle: '#047857', trend: '#059669' },
    },
    {
      gradient: ['#FFF7ED', '#FFEDD5', '#FED7AA'],
      text: { title: '#9A3412', value: '#7C2D12', subtitle: '#C2410C', trend: '#EA580C' },
    },
    {
      gradient: ['#F0F9FF', '#E0F2FE', '#BAE6FD'],
      text: { title: '#1E3A8A', value: '#1E40AF', subtitle: '#2563EB', trend: '#3B82F6' },
    },
  ];

  const renderItemsModal = () => (
    <Modal visible={showItemsModal} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Scrap Items</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Item Name (e.g., Newspaper)"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TextInput
                style={[styles.modalInput, {flex: 1, marginRight: 8}]}
                placeholder="Qty (kg)"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, {flex: 1}]}
                placeholder="Price/kg"
                value={newItem.price}
                onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.addItemButton} onPress={handleAddNewItem}>
              <Text style={styles.modalButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemText}>{item.name} ({item.quantity}kg @ ₹{item.price}/kg)</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                   <Ionicons name="trash-bin-outline" size={20} color={Colors.terracotta} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalButton} onPress={handleSubmitItems}>
            <Text style={styles.modalButtonText}>Submit Items for Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowItemsModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPickupCodeModal = () => (
    <Modal visible={showPickupCodeModal} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter Pickup Code</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Customer's Pickup Code"
            value={pickupCode}
            onChangeText={setPickupCode}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.modalButton} onPress={handleVerifyPickupCode}>
            <Text style={styles.modalButtonText}>Verify & Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowPickupCodeModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPickupCard = (pickup: PickupRequest, index: number) => {
    const { actionLabel, onAction, actionColor } = getActionProps(pickup);

    const getGradient = () => {
      switch (pickup.status) {
        case 'pending': return ['#fff7ed', '#fef3c7'];
        case 'accepted': return ['#e0f2fe', '#bae6fd'];
        case 'in-process': return ['#ede9fe', '#c7d2fe'];
        case 'pending-approval': return ['#fef9c3', '#fde68a'];
        case 'completed': return ['#dcfce7', '#bbf7d0'];
        default: return ['#f3f4f6', '#e5e7eb'];
      }
    };
  
    const getStatusColor = () => {
      switch (pickup.status) {
        case 'pending': return Colors.warning;
        case 'accepted': return Colors.info;
        case 'in-process': return Colors.secondary;
        case 'pending-approval': return Colors.earth;
        case 'completed': return Colors.success;
        default: return Colors.gray[400];
      }
    };
  
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'pending': return 'time-outline';
        case 'accepted': return 'checkmark-circle-outline';
        case 'in-process': return 'car-outline';
        case 'pending-approval': return 'scale-outline';
        case 'completed': return 'checkmark-done-circle';
        default: return 'document-outline';
      }
    };

    return (
        <LinearGradient key={pickup.id} colors={getGradient() as any} style={styles.pickupCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.customerName}>{pickup.customerName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Ionicons name={getStatusIcon(pickup.status) as any} size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{pickup.status.replace('-', ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.cardInfoRow}>
            <Ionicons name="call-outline" size={16} color={Colors.textSecondary} style={styles.cardInfoIcon} />
            <Text style={styles.cardInfoText}>{pickup.customerPhone}</Text>
          </View>

          <View style={styles.cardInfoRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} style={styles.cardInfoIcon} />
            <Text style={styles.cardInfoText}>{pickup.pickupDate}</Text>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} style={[styles.cardInfoIcon, { marginLeft: 16 }]} />
            <Text style={styles.cardInfoText}>{pickup.timeSlot}</Text>
          </View>

          <View style={styles.cardInfoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} style={styles.cardInfoIcon} />
            <Text style={styles.cardInfoText} numberOfLines={1}>{pickup.address}</Text>
          </View>

          {pickup.mapLink && (
             <View style={styles.cardInfoRow}>
              <Ionicons name="map-outline" size={16} color={Colors.info} style={styles.cardInfoIcon} />
              <Text style={[styles.cardInfoText, {color: Colors.info}]}>{pickup.mapLink}</Text>
            </View>
          )}

          {onAction && actionLabel && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: actionColor || Colors.primary }]}
              onPress={onAction}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
    );
  };
  
  const SummaryCard: React.FC<any> = ({
    title,
    value,
    subtitle,
    trend,
    gradientColors,
    textColors,
    totalCount = 17,
    isActive,
    index,
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
      const delay = index * 150;
      
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 8, delay, useNativeDriver: true }),
      ]).start(() => {
        Animated.stagger(
          50,
          progressAnimations.map((anim) =>
            Animated.spring(anim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true })
          )
        ).start();
      });
  
      if (isActive) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
      }
  
      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ).start();
  
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 1, duration: 3000 + index * 500, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 3000 + index * 500, useNativeDriver: true }),
        ])
      ).start();
    }, []);
  
    const handlePress = () => {
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.98, duration: 100, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
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
  
    return (
      <Animated.View style={[ styles.summaryCard, { opacity: cardOpacity, transform: [{ scale: cardScale }, { translateY: floatTranslateY }] }]}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBackground}>
          <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardContent}>
            <Animated.View style={[ styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] } ]}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>
            
            <View style={styles.statsHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.statsTitle, { color: textColors.title }]}>{title}</Text>
                {isActive && (
                  <Animated.View style={[ styles.activeIndicator, { transform: [{ scale: pulseAnim }], backgroundColor: textColors.trend }]} />
                )}
              </View>
              <TouchableOpacity style={[styles.infoButton, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={textColors.subtitle} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.metricContainer}>
              <View style={styles.valueRow}>
                <Text style={[styles.statsValue, { color: textColors.value }]}>{value}</Text>
                <Text style={[styles.statsSubtitle, { color: textColors.subtitle }]}>{subtitle}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              {Array.from({ length: totalCount }).map((_, barIndex) => (
                <Animated.View key={barIndex} style={[ styles.progressBar, { backgroundColor: barIndex < parseInt(value) ? textColors.trend : 'rgba(255,255,255,0.5)', transform: [{ scaleY: progressAnimations[barIndex] }] }]} />
              ))}
            </View>
            
            <View style={styles.trendContainer}>
              <Ionicons name="trending-up" size={12} color={textColors.trend} />
              <Text style={[styles.trendText, { color: textColors.subtitle }]}>{trend}</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const assignedPickups = authState.user ? getPickupRequestsByPartner(authState.user.id) : [];
  const availablePickups = getAvailablePickups();

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary}/>}
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
              <View style={styles.headerWelcome}>
                <Ionicons name="leaf-outline" size={24} color={Colors.primary} />
                <Text style={styles.greeting}>Welcome to EpiCircle!</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.tagline}>Manage your pickups and earnings</Text>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Summary</Text>
              <View style={styles.summaryContainer}>
                <SummaryCard
                  index={0}
                  title="Available Pickups"
                  value={availablePickups.length.toString()}
                  subtitle="Ready to accept"
                  trend="Updated live"
                  gradientColors={cardColors[0].gradient}
                  textColors={cardColors[0].text}
                  isActive={availablePickups.length > 0}
                />
                <SummaryCard
                  index={1}
                  title="Assigned to You"
                  value={assignedPickups.filter(p => p.status !== 'completed').length.toString()}
                  subtitle="In progress"
                  trend={`${getCompletedPickupsCount(assignedPickups)} completed`}
                  gradientColors={cardColors[1].gradient}
                  textColors={cardColors[1].text}
                  isActive={assignedPickups.filter(p => p.status !== 'completed').length > 0}
                />
                <SummaryCard
                  index={2}
                  title="Completed Pickups"
                  value={getCompletedPickupsCount(assignedPickups).toString()}
                  subtitle="Finished"
                  trend="Well done!"
                  gradientColors={cardColors[2].gradient}
                  textColors={cardColors[2].text}
                />
              </View>
            </View>

            {/* Lists Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Assigned Pickups</Text>
              {assignedPickups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="file-tray-outline" size={48} color={Colors.gray[400]} />
                  <Text style={styles.emptyStateText}>You have no assigned pickups.</Text>
                </View>
              ) : (
                assignedPickups.map((pickup, index) => renderPickupCard(pickup, index))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available for Pickup</Text>
              {availablePickups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="file-tray-stacked-outline" size={48} color={Colors.gray[400]} />
                  <Text style={styles.emptyStateText}>No new pickups available right now.</Text>
                </View>
              ) : (
                availablePickups.map((pickup, index) => renderPickupCard(pickup, index))
              )}
            </View>
          </Animated.View>
        </ScrollView>
        {renderItemsModal()}
        {renderPickupCodeModal()}
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
    alignItems: 'center',
    marginBottom: 12,
  },
  headerWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    ...Typography.styles.title2 as any,
    color: Colors.textPrimary,
  },
  tagline: {
    ...Typography.styles.footnote as any,
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
    padding: 24,
  },
  summaryContainer: {
    gap: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.styles.title3 as any,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
  },
  emptyStateText: {
    ...Typography.styles.body as any,
    color: Colors.gray[500],
    marginTop: 8,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    ...Typography.styles.title2 as any,
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    ...Typography.styles.body as any,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderColor: Colors.gray[300],
    borderWidth: 1,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    ...Typography.styles.headline as any,
    color: Colors.white,
    fontWeight: '600' as '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    marginTop: 5,
  },
  cancelButtonText: {
    ...Typography.styles.headline as any,
    color: Colors.gray[600],
    fontWeight: '500' as '500',
  },
  // Add Items Modal Specific Styles
  addItemContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingBottom: 15,
  },
  addItemButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  itemsList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  itemText: {
    ...Typography.styles.body as any,
    color: Colors.textSecondary,
  },
  // Pickup Card Styles
  pickupCard: {
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    ...Typography.styles.title3 as any,
    color: Colors.textPrimary,
    fontWeight: '700' as '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  statusText: {
    ...Typography.styles.footnote as any,
    color: '#fff',
    fontWeight: '600' as '600',
    textTransform: 'capitalize',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfoIcon: {
    marginRight: 8,
  },
  cardInfoText: {
    ...Typography.styles.body as any,
    color: Colors.textSecondary,
  },
  mapLink: {
    ...Typography.styles.footnote as any,
    color: Colors.info,
    marginBottom: 2,
  },
  pickupCode: {
    ...Typography.styles.bodyEmphasized as any,
    color: Colors.info,
    marginBottom: 2,
  },
  actionButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    ...Typography.styles.headline as any,
    color: '#fff',
    fontWeight: '600' as '600',
  },
  // Summary Card Styles
  summaryCard: {
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
}); 