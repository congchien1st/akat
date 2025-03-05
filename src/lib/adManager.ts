import { supabase, handleSupabaseError } from './supabase';

export interface SystemAdAccount {
  id: string;
  account_id: string;
  name: string;
  status: string;
  daily_budget: number;
  total_spent: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdAccountRental {
  id: string;
  user_id: string;
  account_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  account?: SystemAdAccount;
}

export async function checkAdManagerAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    const data = await handleSupabaseError(
      supabase
        .from('ad_manager_access')
        .select('id')
        .eq('email', user.email)
        .single()
    );

    return !!data;
  } catch (error) {
    console.error('Error checking ad manager access:', error);
    return false;
  }
}

export async function getSystemAdAccounts(): Promise<SystemAdAccount[]> {
  try {
    return await handleSupabaseError(
      supabase
        .from('system_ad_accounts')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false })
    );
  } catch (error) {
    console.error('Error fetching system ad accounts:', error);
    throw error;
  }
}

export async function getRentals(userId?: string): Promise<AdAccountRental[]> {
  try {
    const query = supabase
      .from('ad_account_rentals')
      .select(`
        *,
        account:system_ad_accounts(*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query.eq('user_id', userId);
    }

    return await handleSupabaseError(query);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    throw error;
  }
}

export async function createRental(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<AdAccountRental> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if account is available
    const account = await handleSupabaseError(
      supabase
        .from('system_ad_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('available', true)
        .single()
    );

    if (!account) {
      throw new Error('Selected ad account is not available');
    }

    // Check for existing active rentals
    const existingRentals = await handleSupabaseError(
      supabase
        .from('ad_account_rentals')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'active')
    );

    if (existingRentals.length > 0) {
      throw new Error('This ad account is already rented');
    }

    return await handleSupabaseError(
      supabase
        .from('ad_account_rentals')
        .insert({
          account_id: accountId,
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        })
        .select()
        .single()
    );
  } catch (error) {
    console.error('Error creating rental:', error);
    throw error;
  }
}

export async function updateRentalStatus(
  rentalId: string,
  status: AdAccountRental['status']
): Promise<void> {
  try {
    await handleSupabaseError(
      supabase
        .from('ad_account_rentals')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', rentalId)
        .select()
    );
  } catch (error) {
    console.error('Error updating rental status:', error);
    throw error;
  }
}