import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "登录失败",
            description: error.message === "Invalid login credentials" 
              ? "邮箱或密码错误，请检查后重试" 
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "登录成功",
            description: "欢迎回到嘉哥优选！",
          });
          navigate('/');
        }
      } else {
        // Sign up
        if (password !== confirmPassword) {
          toast({
            title: "注册失败",
            description: "两次输入的密码不一致",
            variant: "destructive",
          });
          return;
        }

        if (password.length < 6) {
          toast({
            title: "注册失败",
            description: "密码长度至少需要6位",
            variant: "destructive",
          });
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          toast({
            title: "注册失败",
            description: error.message === "User already registered" 
              ? "该邮箱已被注册，请直接登录" 
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "注册成功",
            description: "账户创建成功，正在为您登录...",
          });
          // Auto-login after successful signup
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: isLogin ? "登录失败" : "注册失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-primary">嘉哥优选</h1>
          <p className="text-muted-foreground">
            {isLogin ? "登录您的账户" : "创建新账户"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "用户登录" : "用户注册"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "请输入密码" : "请设置密码（至少6位）"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? "处理中..." : (isLogin ? "登录" : "注册")}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "还没有账户？" : "已有账户？"}
                <Button
                  variant="link"
                  className="p-0 ml-1 h-auto font-semibold"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  {isLogin ? "立即注册" : "立即登录"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-foreground">
                  {isLogin ? "登录后您可以：" : "注册后您可以："}
                </p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 浏览海量优质食材商品</li>
                  <li>• 与认证供应商直接沟通</li>
                  <li>• 获取专业AI采购建议</li>
                  <li>• 管理订单和报价记录</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;