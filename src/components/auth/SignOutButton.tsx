import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { directSignOut } from '@/utils/auth';
import { cn } from '@/lib/utils';

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className,
  children = '退出登录',
  showIcon = true
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    
    try {
      toast({
        title: "正在退出...",
        description: "正在清理登录状态，请稍候",
      });
      
      await directSignOut();
      
    } catch (error) {
      console.error('SignOut error:', error);
      
      toast({
        title: "退出失败",
        description: "遇到网络问题，正在强制清理本地状态",
        variant: "destructive",
      });
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
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
};
