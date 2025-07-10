import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PickupRequest, PickupItem, DataState, PickupStatus } from '../types';

interface DataContextType {
  dataState: DataState;
  createPickupRequest: (request: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updatePickupRequest: (id: string, updates: Partial<PickupRequest>) => Promise<void>;
  updatePickupRequestStatus: (id: string, status: PickupStatus) => Promise<void>;
  acceptPickupRequest: (id: string, partnerId: string, partnerName: string, partnerPhone: string) => Promise<void>;
  startPickup: (id: string, pickupCode: string) => Promise<boolean>;
  addItems: (id: string, items: PickupItem[], totalAmount: number) => Promise<void>;
  approvePickup: (id: string) => Promise<void>;
  getPickupRequestsByCustomer: (customerId: string) => PickupRequest[];
  getPickupRequestsByPartner: (partnerId: string) => PickupRequest[];
  getAvailablePickups: () => PickupRequest[];
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [dataState, setDataState] = useState<DataState>({
    pickupRequests: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    loadData();
  }, []);



  const loadData = async () => {
    try {
      setDataState(prev => ({ ...prev, loading: true }));
      const storedData = await AsyncStorage.getItem('pickupRequests');
      const pickupRequests = storedData ? JSON.parse(storedData) : [];
      
      setDataState(prev => ({
        ...prev,
        pickupRequests,
        loading: false,
      }));

      // Seed demo data if no data exists
      if (pickupRequests.length === 0) {
        // All demo data removed to ensure a fully dynamic workflow.
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setDataState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data',
      }));
    }
  };

  const saveData = async (pickupRequests: PickupRequest[]) => {
    try {
      await AsyncStorage.setItem('pickupRequests', JSON.stringify(pickupRequests));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const generatePickupCode = (): string => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const createPickupRequest = async (request: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      const newRequest: PickupRequest = {
        ...request,
        id: Date.now().toString(),
        status: 'pending' as PickupStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedRequests = [...dataState.pickupRequests, newRequest];
      setDataState(prev => ({ ...prev, pickupRequests: updatedRequests }));
      await saveData(updatedRequests);
    } catch (error) {
      console.error('Error creating pickup request:', error);
      setDataState(prev => ({ ...prev, error: 'Failed to create pickup request' }));
    }
  };

  const updatePickupRequest = async (id: string, updates: Partial<PickupRequest>) => {
    try {
      const updatedRequests = dataState.pickupRequests.map(request =>
        request.id === id
          ? { ...request, ...updates, updatedAt: new Date().toISOString() }
          : request
      );

      setDataState(prev => ({ ...prev, pickupRequests: updatedRequests }));
      await saveData(updatedRequests);
    } catch (error) {
      console.error('Error updating pickup request:', error);
      setDataState(prev => ({ ...prev, error: 'Failed to update pickup request' }));
    }
  };

  const updatePickupRequestStatus = async (id: string, status: PickupStatus) => {
    await updatePickupRequest(id, { status });
  };

  const acceptPickupRequest = async (id: string, partnerId: string, partnerName: string, partnerPhone: string) => {
    const pickupCode = generatePickupCode();
    await updatePickupRequest(id, {
      status: 'accepted',
      partnerId,
      partnerName,
      partnerPhone,
      pickupCode,
    });
  };

  const startPickup = async (id: string, enteredCode: string): Promise<boolean> => {
    const request = dataState.pickupRequests.find(r => r.id === id);
    if (!request || !request.pickupCode) {
      return false;
    }

    if (enteredCode.toUpperCase() === request.pickupCode.toUpperCase()) {
      await updatePickupRequest(id, { status: 'in-process' });
      return true;
    }

    return false;
  };

  const addItems = async (id: string, items: PickupItem[], totalAmount: number) => {
    await updatePickupRequest(id, {
      items,
      totalAmount,
      status: 'pending-approval',
    });
  };

  const approvePickup = async (id: string) => {
    await updatePickupRequest(id, { status: 'completed' });
  };

  const getPickupRequestsByCustomer = (customerId: string): PickupRequest[] => {
    return dataState.pickupRequests.filter(request => request.customerId === customerId);
  };

  const getPickupRequestsByPartner = (partnerId: string): PickupRequest[] => {
    return dataState.pickupRequests.filter(request => request.partnerId === partnerId);
  };

  const getAvailablePickups = (): PickupRequest[] => {
    return dataState.pickupRequests.filter(request => request.status === 'pending');
  };

  const refreshData = async () => {
    await loadData();
  };

  const value: DataContextType = {
    dataState,
    createPickupRequest,
    updatePickupRequest,
    updatePickupRequestStatus,
    acceptPickupRequest,
    startPickup,
    addItems,
    approvePickup,
    getPickupRequestsByCustomer,
    getPickupRequestsByPartner,
    getAvailablePickups,
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 