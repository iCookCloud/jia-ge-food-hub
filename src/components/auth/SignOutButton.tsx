import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const SignOutButton = React.forwardRef<HTMLButtonElement, SignOutButtonProps>(({
  variant = 'outline',
  size = 'default',
  className,
  children = '退出登录',
  showIcon = true
}, ref) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    
    try {
      // 使用 useAuth 的统一退出方法，确保状态同步
      await signOut();
      
    } catch (error) {
      console.error('SignOut error:', error);
      
      // 如果 useAuth 的退出失败，作为备选方案强制跳转
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
      
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={cn(
        "transition-all duration-200",
        isSigningOut && "opacity-75 cursor-not-allowed",
        className
      )}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          退出中...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  );
});

SignOutButton.displayName = 'SignOutButton';
