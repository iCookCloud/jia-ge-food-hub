import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Phone, 
  Lock, 
  Bell, 
  Mail,
  Shield,
  Smartphone,
  Eye,
  EyeOff
} from "lucide-react";

const SettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Security
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    phone: "138****8000",
    twoFactorEnabled: false,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    
    // Preferences
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    currency: "CNY"
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">账户设置</h1>
          <p className="text-muted-foreground">管理您的安全设置、通知偏好和系统配置</p>
        </div>

        <div className="max-w-4xl">
          <Tabs defaultValue="security" className="space-y-6">
            <TabsList>
              <TabsTrigger value="security">安全设置</TabsTrigger>
              <TabsTrigger value="notifications">通知设置</TabsTrigger>
              <TabsTrigger value="preferences">偏好设置</TabsTrigger>
            </TabsList>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    修改密码
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>当前密码</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) => handleSettingChange("currentPassword", e.target.value)}
                        placeholder="请输入当前密码"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>新密码</Label>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? "text" : "password"}
                        value={settings.newPassword}
                        onChange={(e) => handleSettingChange("newPassword", e.target.value)}
                        placeholder="请输入新密码"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>确认新密码</Label>
                    <Input 
                      type="password"
                      value={settings.confirmPassword}
                      onChange={(e) => handleSettingChange("confirmPassword", e.target.value)}
                      placeholder="请确认新密码"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    密码要求：至少8位字符，包含字母、数字和特殊字符
                  </div>

                  <Button>更新密码</Button>
                </CardContent>
              </Card>

              {/* Phone Number */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    手机号码
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">当前手机号</div>
                      <div className="text-sm text-muted-foreground">{settings.phone}</div>
                    </div>
                    <Button variant="outline">更换手机号</Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    手机号用于登录验证和重要通知，更换后需要验证新手机号
                  </div>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    两步验证
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">短信验证码</div>
                      <div className="text-sm text-muted-foreground">
                        登录时需要手机验证码确认身份
                      </div>
                    </div>
                    <Switch 
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSettingChange("twoFactorEnabled", checked)}
                    />
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-medium text-sm">验证器应用</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">推荐</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      使用Google Authenticator或类似应用生成验证码
                    </div>
                    <Button variant="outline" size="sm">设置验证器</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Login History */}
              <Card>
                <CardHeader>
                  <CardTitle>登录记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { location: "北京市", device: "Chrome 浏览器", time: "2024-01-16 14:30", current: true },
                      { location: "北京市", device: "移动端APP", time: "2024-01-16 09:15", current: false },
                      { location: "上海市", device: "Safari 浏览器", time: "2024-01-15 16:20", current: false }
                    ].map((login, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium text-sm">
                            {login.location} - {login.device}
                            {login.current && <span className="text-success ml-2">(当前设备)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{login.time}</div>
                        </div>
                        {!login.current && (
                          <Button variant="ghost" size="sm">注销</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    通知设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      邮件通知
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: "订单状态更新", description: "订单确认、发货、签收等状态变更", key: "emailNotifications" },
                        { label: "询价报价通知", description: "收到新询价或报价回复", key: "emailNotifications" },
                        { label: "账户安全提醒", description: "登录异常、密码修改等安全事件", key: "emailNotifications" },
                        { label: "营销推广邮件", description: "产品推荐、优惠活动等营销信息", key: "marketingEmails" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                          <Switch 
                            checked={settings[item.key]}
                            onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      短信通知
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: "重要订单通知", description: "大额订单确认和紧急状态变更" },
                        { label: "验证码短信", description: "登录和安全操作验证码" },
                        { label: "账户异常提醒", description: "账户安全相关的紧急通知" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                          <Switch 
                            checked={settings.smsNotifications}
                            onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      推送通知
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: "即时消息推送", description: "聊天消息、系统通知等实时推送" },
                        { label: "业务提醒推送", description: "待处理事项、截止日期等提醒" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                          <Switch 
                            checked={settings.pushNotifications}
                            onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>系统偏好</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>界面语言</Label>
                      <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-CN">简体中文</SelectItem>
                          <SelectItem value="zh-TW">繁體中文</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>时区设置</Label>
                      <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                          <SelectItem value="Asia/Hong_Kong">香港时间 (UTC+8)</SelectItem>
                          <SelectItem value="Asia/Taipei">台北时间 (UTC+8)</SelectItem>
                          <SelectItem value="UTC">协调世界时 (UTC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>货币单位</Label>
                      <Select value={settings.currency} onValueChange={(value) => handleSettingChange("currency", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNY">人民币 (¥)</SelectItem>
                          <SelectItem value="HKD">港币 (HK$)</SelectItem>
                          <SelectItem value="USD">美元 ($)</SelectItem>
                          <SelectItem value="EUR">欧元 (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button>保存设置</Button>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle>数据管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">导出数据</div>
                      <div className="text-sm text-muted-foreground">
                        导出您的账户数据，包括订单记录、询价历史等
                      </div>
                    </div>
                    <Button variant="outline">申请导出</Button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <div className="font-medium text-destructive">删除账户</div>
                      <div className="text-sm text-muted-foreground">
                        永久删除您的账户和所有相关数据
                      </div>
                    </div>
                    <Button variant="destructive" className="bg-destructive">删除账户</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;