import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'ADMIN_ACTION';

export interface AuditLogData {
  action: AuditAction;
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function createAuditLog(logData: AuditLogData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action: logData.action,
      resource: logData.resource,
      resource_id: logData.resource_id,
      details: logData.details || {},
      ip_address: logData.ip_address,
      user_agent: logData.user_agent,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(
  filters: {
    user_id?: string;
    action?: AuditAction;
    resource?: string;
    start_date?: string;
    end_date?: string;
  } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 50 }
) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.resource) {
    query = query.eq('resource', filters.resource);
  }
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    logs: data,
    total: count || 0,
    page: pagination.page,
    totalPages: Math.ceil((count || 0) / pagination.limit),
  };
}