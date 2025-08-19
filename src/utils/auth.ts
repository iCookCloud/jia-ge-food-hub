import { supabase } from '@/integrations/supabase/client';

/**
 * 安全的退出登录函数
 * 即使 Supabase 服务器返回错误，也能确保本地状态被清理
 */
export const safeSignOut = async (): Promise<void> => {
  try {
    // 1. 清理所有本地存储的认证信息
    const authKeys = [
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'supabase.auth.expires_in',
      'supabase.auth.access_token',
      'supabase.auth.user',
      'supabase.auth.session'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e);
      }
    });

    // 2. 清理其他可能存在的认证相关数据
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      localStorage.removeItem('profile');
      localStorage.removeItem('userRole');
    } catch (e) {
      console.warn('Failed to remove custom auth data:', e);
    }

    // 3. 尝试调用 Supabase 退出（使用本地范围）
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local' // 只清理本地，不调用服务器
      });
      
      if (error) {
        console.warn('Supabase signOut warning:', error);
      }
    } catch (e) {
      console.warn('Supabase signOut failed:', e);
    }

    // 4. 清理内存中的认证状态
    try {
      // 重置 Supabase 客户端状态
      await supabase.auth.setSession(null);
    } catch (e) {
      console.warn('Failed to reset Supabase session:', e);
    }

    // 5. 强制清理浏览器缓存（可选）
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
    } catch (e) {
      console.warn('Failed to clear caches:', e);
    }

    console.log('Safe signOut completed successfully');
    
  } catch (error) {
    console.error('Safe signOut error:', error);
    // 即使出错，也要确保基本清理完成
  }
};

/**
 * 强制退出登录
 * 使用页面刷新确保完全清理
 */
export const forceSignOut = async (): Promise<void> => {
  console.log('Starting forceSignOut...');
  
  try {
    // 1. 执行安全退出
    await safeSignOut();
    console.log('Safe signOut completed');
    
    // 2. 清理所有可能的状态
    try {
      // 清理 React 状态（通过事件触发）
      window.dispatchEvent(new CustomEvent('forceSignOut'));
    } catch (e) {
      console.warn('Failed to dispatch forceSignOut event:', e);
    }
    
    // 3. 强制跳转到登录页
    console.log('Redirecting to /auth...');
    
    // 使用多种方法确保跳转成功
    try {
      // 方法1: 直接跳转
      window.location.href = '/auth';
      
      // 方法2: 如果跳转失败，使用 replace
      setTimeout(() => {
        if (window.location.pathname !== '/auth') {
          console.log('Fallback: using replace...');
          window.location.replace('/auth');
        }
      }, 100);
      
      // 方法3: 如果还是失败，强制刷新
      setTimeout(() => {
        if (window.location.pathname !== '/auth') {
          console.log('Fallback: forcing reload...');
          window.location.reload();
        }
      }, 500);
      
    } catch (e) {
      console.error('Failed to redirect:', e);
      
      // 最后的备选方案：强制刷新
      try {
        window.location.reload();
      } catch (reloadError) {
        console.error('Failed to reload:', reloadError);
        
        // 最后的最后：手动清理并显示消息
        alert('退出登录完成，请手动刷新页面');
      }
    }
    
  } catch (error) {
    console.error('forceSignOut error:', error);
    
    // 即使出错，也要尝试跳转
    try {
      window.location.href = '/auth';
    } catch (e) {
      console.error('Emergency redirect failed:', e);
      window.location.reload();
    }
  }
};

/**
 * 检查用户是否已退出
 */
export const isSignedOut = (): boolean => {
  try {
    const token = localStorage.getItem('supabase.auth.token');
    const expiresAt = localStorage.getItem('supabase.auth.expires_at');
    
    if (!token) return true;
    
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt);
      if (Date.now() > expiryTime) return true;
    }
    
    return false;
  } catch (e) {
    console.warn('Failed to check sign out status:', e);
    return true; // 出错时假设已退出
  }
};

/**
 * 清理过期的认证数据
 */
export const cleanupExpiredAuth = (): void => {
  try {
    const expiresAt = localStorage.getItem('supabase.auth.expires_at');
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt);
      if (Date.now() > expiryTime) {
        console.log('Cleaning up expired auth data');
        safeSignOut();
      }
    }
  } catch (e) {
    console.warn('Failed to cleanup expired auth:', e);
  }
};

/**
 * 直接退出登录 - 最可靠的方法
 */
export const directSignOut = async (): Promise<void> => {
  console.log('Direct signOut started');
  
  try {
    // 1. 立即清理本地状态
    const authKeys = [
      'supabase.auth.token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'supabase.auth.expires_in',
      'supabase.auth.access_token',
      'supabase.auth.user',
      'supabase.auth.session'
    ];
    
    // 清理所有认证数据
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e);
      }
    });

    // 清理自定义数据
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      localStorage.removeItem('profile');
      localStorage.removeItem('userRole');
    } catch (e) {
      console.warn('Failed to remove custom auth data:', e);
    }

    // 2. 尝试 Supabase 退出（不等待结果）
    try {
      supabase.auth.signOut({ scope: 'local' }).catch(e => 
        console.warn('Supabase signOut failed:', e)
      );
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }

    // 3. 立即跳转（不等待异步操作）
    console.log('Immediate redirect to /auth');
    
    // 使用多种跳转方法
    try {
      // 方法1: 直接跳转
      window.location.href = '/auth';
    } catch (e) {
      console.warn('Direct href failed:', e);
      
      try {
        // 方法2: 使用 replace
        window.location.replace('/auth');
      } catch (e2) {
        console.warn('Replace failed:', e2);
        
        try {
          // 方法3: 强制刷新
          window.location.reload();
        } catch (e3) {
          console.error('All redirect methods failed:', e3);
          
          // 最后的方案：显示消息
          alert('退出登录完成，请手动访问登录页面');
        }
      }
    }
    
  } catch (error) {
    console.error('Direct signOut error:', error);
    
    // 即使出错，也要尝试跳转
    try {
      window.location.href = '/auth';
    } catch (e) {
      console.error('Emergency redirect failed:', e);
      alert('退出登录遇到问题，请手动刷新页面');
    }
  }
};
