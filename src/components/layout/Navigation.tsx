import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDisplayName, getRoleColor } from "@/hooks/useRole";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  Package, 
  Building2, 
  Video, 
  FileText, 
  User, 
  Users,
  Search, 
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  UserPlus,
  LogIn,
  ShoppingCart,
  MessageCircle
} from "lucide-react";

const navigationItems = [
  {
    title: "商品",
    href: "/products",
    icon: Package,
    description: "商品浏览与查看"
  },
  {
    title: "展示",
    href: "/materials",
    icon: Video,
    description: "产品展示视频"
  },
  {
    title: "订单",
    href: "/orders",
    icon: ShoppingCart,
    description: "订单管理"
  },
  {
    title: "询价",
    href: "/quotations",
    icon: MessageCircle,
    description: "询价与沟通"
  },
  {
    title: "管理",
    href: "/profile",
    icon: User,
    description: "个人与企业管理"
  }
];

export function DesktopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, profile, signOut, isAdmin } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">嘉哥优选</span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-1 flex-1">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 font-medium transition-all",
                    isActive && "shadow-sm"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Search and Actions */}
        <div className="flex items-center space-x-2">
          <GlobalSearch>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
              <Search className="h-4 w-4" />
            </Button>
          </GlobalSearch>
          <NotificationBell className="text-muted-foreground" />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm max-w-20 truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* User Info */}
                <div className="px-3 py-2 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {(profile?.nickname || user.email)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile?.nickname || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {userRole && (
                        <Badge variant="secondary" className={cn("text-xs mt-1", getRoleColor(userRole))}>
                          {getRoleDisplayName(userRole)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  个人资料
                </DropdownMenuItem>
                
                {/* Role-specific menu items */}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/products')}>
                      <Package className="h-4 w-4 mr-2" />
                      商品管理
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-1" />
                登录
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                <UserPlus className="h-4 w-4 mr-1" />
                注册
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, profile, signOut } = useAuth();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">嘉哥优选</span>
          </Link>

          <div className="flex items-center space-x-2">
            <GlobalSearch>
              <Button variant="ghost" size="icon-sm">
                <Search className="h-4 w-4" />
              </Button>
            </GlobalSearch>
            <NotificationBell />
            
            {user ? (
              <Avatar className="h-7 w-7 mr-1">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs px-2 h-7"
                onClick={() => navigate('/auth')}
              >
                登录
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = item.href === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.href);
                
                return (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <div>
                      <div>{item.title}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Auth Actions in Menu */}
              {user ? (
                <>
                  <div className="border-t border-border my-2"></div>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    <div>退出登录</div>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-border my-2"></div>
                  <Link 
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <LogIn className="h-4 w-4" />
                    <div>登录 / 注册</div>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link 
                key={item.href} 
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-1 text-xs font-medium transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive && "text-primary"
                )} />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}