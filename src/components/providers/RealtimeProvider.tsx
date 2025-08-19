import React, { ReactNode } from 'react';
import { useRealtimeNotifications, useRealtimeProfile, useRealtimeOrderLists } from '@/hooks/useRealtimeNotifications';

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * 实时更新提供者组件
 * 负责为整个应用启用实时更新功能
 */
export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  // 启用所有实时更新功能
  useRealtimeNotifications();
  useRealtimeProfile();
  useRealtimeOrderLists();

  return <>{children}</>;
};