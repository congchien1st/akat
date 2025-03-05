import { useAuthStore } from '../store/authStore';
import { supabase } from './supabase';

export type AdAccountStatus = 'good' | 'hold' | 'disabled' | 'restricted' | 'checkpoint' | 'limited';

export interface AdAccountMetrics {
  monthlySpend: number;
  approvalTime: number;
  reach: number;
  revenue: number;
}

export interface AdAccount {
  id: string;
  accountId: string;
  name: string;
  status: AdAccountStatus;
  metrics: AdAccountMetrics;
  createdAt: string;
  updatedAt: string;
}

export const getStatusColor = (status: AdAccountStatus): string => {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'hold':
      return 'text-yellow-600';
    case 'disabled':
      return 'text-red-600';
    case 'restricted':
      return 'text-orange-600';
    case 'checkpoint':
      return 'text-red-600';
    case 'limited':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

export const getStatusText = (status: AdAccountStatus): string => {
  switch (status) {
    case 'good':
      return 'Tốt';
    case 'hold':
      return 'Tạm giữ';
    case 'disabled':
      return 'Vô hiệu hóa';
    case 'restricted':
      return 'Hạn chế quảng cáo';
    case 'checkpoint':
      return 'Tài khoản checkpoint';
    case 'limited':
      return 'Bị hạn chế phân phối quảng cáo';
    default:
      return 'Không xác định';
  }
};

export const fetchAdAccounts = async (): Promise<AdAccount[]> => {
  const { data, error } = await supabase
    .from('ad_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const createAdAccount = async (
  accountId: string,
  name: string,
  status: AdAccountStatus,
  metrics: Partial<AdAccountMetrics> = {}
): Promise<AdAccount> => {
  const { data, error } = await supabase
    .from('ad_accounts')
    .insert({
      account_id: accountId,
      name,
      status,
      metrics: {
        monthlySpend: 0,
        approvalTime: 0,
        reach: 0,
        revenue: 0,
        ...metrics
      }
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateAdAccountStatus = async (
  id: string,
  status: AdAccountStatus
): Promise<void> => {
  const { error } = await supabase
    .from('ad_accounts')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const updateAdAccountMetrics = async (
  id: string,
  metrics: Partial<AdAccountMetrics>
): Promise<void> => {
  const { error } = await supabase
    .from('ad_accounts')
    .update({ metrics })
    .eq('id', id);

  if (error) {
    throw error;
  }
};