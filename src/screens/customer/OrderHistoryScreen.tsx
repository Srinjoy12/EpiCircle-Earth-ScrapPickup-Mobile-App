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
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PickupRequest } from '../../types';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';

interface OrderHistoryScreenProps {
  navigation: any;
}

interface ApprovalItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  pricePerKg: number;
  total: number;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const { authState } = useAuth();
  const { dataState, getPickupRequestsByCustomer, refreshData, updatePickupRequestStatus } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<PickupRequest[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PickupRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Mock approval items for pending approval orders
  const mockApprovalItems: ApprovalItem[] = [
    { id: '1', name: 'Newspapers', category: 'Paper', weight: 5.2, pricePerKg: 8, total: 41.6 },
    { id: '2', name: 'Plastic Bottles', category: 'Plastic', weight: 2.8, pricePerKg: 12, total: 33.6 },
    { id: '3', name: 'Cardboard', category: 'Paper', weight: 3.5, pricePerKg: 6, total: 21.0 },
    { id: '4', name: 'Aluminum Cans', category: 'Metal', weight: 1.2, pricePerKg: 45, total: 54.0 },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (authState.user) {
      const userOrders = getPickupRequestsByCustomer(authState.user.id);
      setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  }, [authState.user, dataState.pickupRequests]);

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
    if (!selectedOrder) return;

    try {
      await updatePickupRequestStatus(selectedOrder.id, 'completed');
      setShowApprovalModal(false);
      setSelectedOrder(null);
      Alert.alert(
        'Order Approved!',
        'Your scrap has been approved and payment will be processed. Thank you for choosing EpiCircle!',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to approve order. Please try again.');
    }
  };

  const handleRejectOrder = () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (selectedOrder) {
              try {
                await updatePickupRequestStatus(selectedOrder.id, 'pending');
                setShowApprovalModal(false);
                setSelectedOrder(null);
                Alert.alert('Order Rejected', 'The order has been sent back for revision.');
              } catch (error) {
                Alert.alert('Error', 'Failed to reject order. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const openApprovalModal = (order: PickupRequest) => {
    setSelectedOrder(order);
    setShowApprovalModal(true);
  };

  const getTotalAmount = () => {
    return mockApprovalItems.reduce((sum, item) => sum + item.total, 0);
  };

  const OrderCard = ({ order }: { order: PickupRequest }) => (
    <View style={styles.orderCard}>
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
          <Ionicons name={getStatusIcon(order.status) as any} size={14} color={Colors.white} />
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderAddressContainer}>
        <Ionicons name="location" size={16} color={Colors.textSecondary} />
        <Text style={styles.orderAddress} numberOfLines={2}>
          {order.address}
        </Text>
      </View>

      {order.pickupCode && (
        <View style={styles.pickupCodeContainer}>
          <Ionicons name="key" size={16} color={Colors.primary} />
          <Text style={styles.pickupCodeLabel}>Pickup Code:</Text>
          <Text style={styles.pickupCode}>{order.pickupCode}</Text>
        </View>
      )}

      {order.partnerId && (
        <View style={styles.partnerContainer}>
          <Ionicons name="person" size={16} color={Colors.textSecondary} />
          <Text style={styles.partnerLabel}>Eco-Warrior ID:</Text>
          <Text style={styles.partnerId}>{order.partnerId}</Text>
        </View>
      )}

      {order.status === 'pending-approval' && (
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => openApprovalModal(order)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.approveButtonText}>Review & Approve</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ApprovalModal = () => (
    <Modal
      visible={showApprovalModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowApprovalModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Approval</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Order Details */}
          <View style={styles.orderDetailsSection}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.orderDetail}>
              <Text style={styles.orderDetailLabel}>Date:</Text>
              <Text style={styles.orderDetailValue}>{selectedOrder?.pickupDate}</Text>
            </View>
            <View style={styles.orderDetail}>
              <Text style={styles.orderDetailLabel}>Time:</Text>
              <Text style={styles.orderDetailValue}>{selectedOrder?.timeSlot}</Text>
            </View>
            <View style={styles.orderDetail}>
              <Text style={styles.orderDetailLabel}>Address:</Text>
              <Text style={styles.orderDetailValue}>{selectedOrder?.address}</Text>
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Collected Items</Text>
            {mockApprovalItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemWeight}>{item.weight} kg</Text>
                  <Text style={styles.itemPrice}>₹{item.pricePerKg}/kg</Text>
                  <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Total Amount */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Weight:</Text>
              <Text style={styles.totalValue}>
                {mockApprovalItems.reduce((sum, item) => sum + item.weight, 0).toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>₹{getTotalAmount().toFixed(2)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={20} color={Colors.white} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveModalButton}
              onPress={handleApproveOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.approveModalButtonText}>Approve & Complete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <View style={{ width: 80 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconContainer}>
                <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyStateTitle}>No orders found</Text>
              <Text style={styles.emptyStateText}>
                Your pickup requests will appear here once you schedule them.
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
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <ApprovalModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    ...Typography.styles.body,
    color: Colors.primary,
  },
  title: {
    ...Typography.styles.title3,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
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
    backgroundColor: Colors.gray[100],
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
  partnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  partnerLabel: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  partnerId: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
  },
  approveButton: {
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  approveButtonText: {
    ...Typography.styles.footnote,
    color: Colors.white,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    ...Typography.styles.title3,
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  orderDetailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDetailLabel: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
  },
  orderDetailValue: {
    ...Typography.styles.subheadline,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  itemsSection: {
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemCategory: {
    ...Typography.styles.caption1,
    color: Colors.textSecondary,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemWeight: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemPrice: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemTotal: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.primary,
  },
  totalSection: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
  },
  totalValue: {
    ...Typography.styles.subheadline,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  totalAmount: {
    ...Typography.styles.title3,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 24,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.white,
  },
  approveModalButton: {
    flex: 2,
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  approveModalButtonText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.white,
  },
}); 