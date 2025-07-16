import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  User, 
  Building, 
  Shield, 
  Key,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

const ProfilePage = () => {
  const [userType, setUserType] = useState("企业");
  const [showApiKey, setShowApiKey] = useState(false);
  const [profileData, setProfileData] = useState({
    // Basic Info
    companyName: "优质食材供应有限公司",
    contactPerson: "张三",
    contactPhone: "13800138000",
    contactEmail: "zhangsan@example.com",
    businessType: "食材批发",
    description: "专业提供优质食材，服务餐饮行业10年",
    
    // Verification
    businessLicense: "营业执照已上传",
    foodLicense: "食品经营许可证已上传",
    verificationStatus: "已认证",
    
    // API Keys
    openaiApiKey: "sk-...abc123",
    difyApiKey: "",
    customApiEndpoint: ""
  });

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "已认证":
        return <Badge variant="secondary" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />已认证</Badge>;
      case "待审核":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><AlertCircle className="w-3 h-3 mr-1" />待审核</Badge>;
      default:
        return <Badge variant="outline">未认证</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">个人信息</h1>
          <p className="text-muted-foreground">管理您的企业信息、认证状态和API配置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    {userType === "企业" ? (
                      <Building className="w-10 h-10 text-primary" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{profileData.companyName}</h3>
                    <p className="text-sm text-muted-foreground">{profileData.contactPerson}</p>
                    {getVerificationBadge(profileData.verificationStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList>
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="verification">认证管理</TabsTrigger>
                <TabsTrigger value="api">API配置</TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>账户类型</Label>
                        <Select value={userType} onValueChange={setUserType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="企业">企业用户</SelectItem>
                            <SelectItem value="个人">个人用户</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {userType === "企业" && (
                        <div>
                          <Label>企业名称</Label>
                          <Input 
                            value={profileData.companyName}
                            onChange={(e) => setProfileData(prev => ({...prev, companyName: e.target.value}))}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>联系人</Label>
                        <Input 
                          value={profileData.contactPerson}
                          onChange={(e) => setProfileData(prev => ({...prev, contactPerson: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label>联系电话</Label>
                        <Input 
                          value={profileData.contactPhone}
                          onChange={(e) => setProfileData(prev => ({...prev, contactPhone: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>邮箱地址</Label>
                        <Input 
                          type="email"
                          value={profileData.contactEmail}
                          onChange={(e) => setProfileData(prev => ({...prev, contactEmail: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label>业务类型</Label>
                        <Select value={profileData.businessType} onValueChange={(value) => setProfileData(prev => ({...prev, businessType: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="食材批发">食材批发</SelectItem>
                            <SelectItem value="海鲜供应">海鲜供应</SelectItem>
                            <SelectItem value="肉类供应">肉类供应</SelectItem>
                            <SelectItem value="蔬果供应">蔬果供应</SelectItem>
                            <SelectItem value="调料香料">调料香料</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>企业简介</Label>
                      <Textarea 
                        value={profileData.description}
                        onChange={(e) => setProfileData(prev => ({...prev, description: e.target.value}))}
                        placeholder="介绍您的企业优势、主营业务、服务特色等..."
                        rows={4}
                      />
                    </div>

                    <Button>保存更改</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Management */}
              <TabsContent value="verification" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      认证管理
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business License */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">营业执照</h4>
                          {getVerificationBadge("已认证")}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          已上传：营业执照副本.pdf
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            重新上传
                          </Button>
                          <Button variant="ghost" size="sm">查看</Button>
                        </div>
                      </div>

                      {/* Food License */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">食品经营许可证</h4>
                          {getVerificationBadge("待审核")}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          已上传：食品许可证.jpg
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            重新上传
                          </Button>
                          <Button variant="ghost" size="sm">查看</Button>
                        </div>
                      </div>

                      {/* Tax Registration */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">税务登记证</h4>
                          {getVerificationBadge("未认证")}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          请上传税务登记证明文件
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          上传文件
                        </Button>
                      </div>

                      {/* Quality Certificate */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">质量认证</h4>
                          {getVerificationBadge("未认证")}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          ISO、HACCP等质量管理体系认证
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          上传文件
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">认证说明</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 营业执照为必需认证项目</li>
                        <li>• 食品相关业务需要食品经营许可证</li>
                        <li>• 质量认证有助于提升信誉度</li>
                        <li>• 认证审核时间通常为1-3个工作日</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Configuration */}
              <TabsContent value="api" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      AI客服API配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">配置说明</h4>
                      <p className="text-sm text-muted-foreground">
                        配置API密钥后，您的客户可以通过AI客服快速获取商品信息、价格咨询等服务。支持OpenAI、Dify等平台。
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* OpenAI API */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">OpenAI API Key</h4>
                          <Badge variant={profileData.openaiApiKey ? "default" : "outline"}>
                            {profileData.openaiApiKey ? "已配置" : "未配置"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Input 
                              type={showApiKey ? "text" : "password"}
                              value={profileData.openaiApiKey}
                              onChange={(e) => setProfileData(prev => ({...prev, openaiApiKey: e.target.value}))}
                              placeholder="请输入OpenAI API Key"
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          <Button variant="outline">测试连接</Button>
                        </div>
                      </div>

                      {/* Dify API */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Dify API Key</h4>
                          <Badge variant="outline">未配置</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Input 
                            type="password"
                            value={profileData.difyApiKey}
                            onChange={(e) => setProfileData(prev => ({...prev, difyApiKey: e.target.value}))}
                            placeholder="请输入Dify API Key"
                          />
                          <Button variant="outline">测试连接</Button>
                        </div>
                      </div>

                      {/* Custom API */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">自定义API端点</h4>
                          <Badge variant="outline">未配置</Badge>
                        </div>
                        <div className="space-y-2">
                          <Input 
                            value={profileData.customApiEndpoint}
                            onChange={(e) => setProfileData(prev => ({...prev, customApiEndpoint: e.target.value}))}
                            placeholder="https://your-api-endpoint.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            支持兼容OpenAI格式的自定义API端点
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button>保存API配置</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;