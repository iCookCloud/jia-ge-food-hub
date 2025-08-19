import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building2, 
  Upload,
  Save,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PersonalInfo {
  nickname: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  bio?: string;
  is_supplier: boolean;
  supplier_status: 'none' | 'pending' | 'approved' | 'rejected';
  supplier_applied_at?: string;
  supplier_approved_at?: string;
  company_name?: string;
  company_description?: string;
  business_license?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}

const ProfileManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRoles, isSupplier } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    nickname: '',
    avatar_url: '',
    phone: '',
    address: '',
    bio: '',
    is_supplier: false,
    supplier_status: 'none',
    supplier_applied_at: '',
    supplier_approved_at: '',
    company_name: '',
    company_description: '',
    business_license: '',
    company_address: '',
    company_phone: '',
    company_email: ''
  });

  // 加载个人信息（包含企业信息）
  const loadPersonalInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading personal info:', error);
        return;
      }

      if (data) {
        setPersonalInfo({
          nickname: data.nickname || '',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
          address: data.address || '',
          bio: data.bio || '',
          is_supplier: data.is_supplier || false,
          supplier_status: data.supplier_status || 'none',
          supplier_applied_at: data.supplier_applied_at || '',
          supplier_approved_at: data.supplier_approved_at || '',
          company_name: data.company_name || '',
          company_description: data.company_description || '',
          business_license: data.business_license || '',
          company_address: data.company_address || '',
          company_phone: data.company_phone || '',
          company_email: data.company_email || ''
        });
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
    }
  };

  // 保存个人信息（包含企业信息）
  const savePersonalInfo = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: personalInfo.nickname,
          phone: personalInfo.phone,
          address: personalInfo.address,
          bio: personalInfo.bio,
          is_supplier: personalInfo.is_supplier,
          company_name: personalInfo.company_name,
          company_description: personalInfo.company_description,
          business_license: personalInfo.business_license,
          company_address: personalInfo.company_address,
          company_phone: personalInfo.company_phone,
          company_email: personalInfo.company_email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('信息保存成功');
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 申请成为供应商
  const applyForSupplier = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          supplier_status: 'pending',
          supplier_applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPersonalInfo(prev => ({
        ...prev,
        supplier_status: 'pending',
        supplier_applied_at: new Date().toISOString()
      }));

      // 发送通知给管理员
      try {
        await notificationService.notifySupplierApplication(
          personalInfo.nickname || user.email?.split('@')[0] || '未知用户',
          user.id,
          personalInfo.company_name
        );
      } catch (notificationError) {
        console.error('Error sending supplier application notification:', notificationError);
        // 通知发送失败不影响申请流程
      }

      toast.success('供应商申请已提交，等待管理员审核');
    } catch (error) {
      console.error('Error applying for supplier:', error);
      toast.error('申请失败，请重试');
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    setLoading(true);
    loadPersonalInfo()
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/management')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理中心
          </Button>
          <div>
            <h1 className="text-2xl font-bold">信息管理</h1>
            <p className="text-muted-foreground">管理您的个人资料和企业信息</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              个人资料和企业信息
            </CardTitle>
            <CardDescription>
              管理您的个人基本信息、联系方式和企业信息
            </CardDescription>
          </CardHeader>
              <CardContent className="space-y-6">
                {/* 头像区域 */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={personalInfo.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {personalInfo.nickname?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-medium">头像</h3>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      上传头像
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      支持 JPG、PNG 格式，不超过 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">昵称 *</Label>
                    <Input
                      id="nickname"
                      value={personalInfo.nickname}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="请输入昵称"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      邮箱地址不可修改
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号码</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="请输入手机号码"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">地址</Label>
                    <Input
                      id="address"
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="请输入地址"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    value={personalInfo.bio}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="请输入个人简介"
                    rows={4}
                  />
                </div>

                <Separator />

                {/* 供应商设置 */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    供应商设置
                  </h4>

                  {/* 供应商状态显示 */}
                  {personalInfo.supplier_status === 'approved' && (
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <h5 className="font-medium text-green-800">已认证供应商</h5>
                          <p className="text-sm text-green-600">
                            您已通过供应商认证，可以接收其他用户的货单分享
                          </p>
                          {personalInfo.supplier_approved_at && (
                            <p className="text-xs text-green-500 mt-1">
                              认证时间：{new Date(personalInfo.supplier_approved_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {personalInfo.supplier_status === 'pending' && (
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h5 className="font-medium text-yellow-800">申请审核中</h5>
                          <p className="text-sm text-yellow-600">
                            您的供应商申请正在等待管理员审核，请耐心等待
                          </p>
                          {personalInfo.supplier_applied_at && (
                            <p className="text-xs text-yellow-500 mt-1">
                              申请时间：{new Date(personalInfo.supplier_applied_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {personalInfo.supplier_status === 'rejected' && (
                    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <h5 className="font-medium text-red-800">申请被拒绝</h5>
                          <p className="text-sm text-red-600">
                            您的供应商申请未通过审核，可以重新申请
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(personalInfo.supplier_status === 'none' || personalInfo.supplier_status === 'rejected') && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-medium text-blue-800 mb-2">申请成为认证供应商</h5>
                            <p className="text-sm text-blue-600 mb-3">
                              成为认证供应商后，您将获得特殊标识，提高用户信任度。即使不是认证供应商，您也可以接收和处理其他用户的货单分享。
                            </p>
                            <Button 
                              onClick={applyForSupplier}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {saving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  申请中...
                                </>
                              ) : (
                                '申请成为供应商'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">参与货单分享</div>
                      <div className="text-sm text-muted-foreground">
                        启用后，其他用户可以将货单分享给您进行处理
                      </div>
                    </div>
                    <Switch
                      checked={personalInfo.is_supplier}
                      onCheckedChange={(checked) => 
                        setPersonalInfo(prev => ({ ...prev, is_supplier: checked }))
                      }
                    />
                  </div>

                  {/* 企业信息（当启用供应商或已申请时显示） */}
                  {(personalInfo.is_supplier || personalInfo.supplier_status !== 'none') && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      <h5 className="font-medium">企业信息（可选）</h5>
                      <p className="text-sm text-muted-foreground">
                        完善企业信息有助于提高用户信任度
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">企业名称</Label>
                          <Input
                            id="company_name"
                            value={personalInfo.company_name}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, company_name: e.target.value }))}
                            placeholder="请输入企业名称"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_phone">企业电话</Label>
                          <Input
                            id="company_phone"
                            value={personalInfo.company_phone}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, company_phone: e.target.value }))}
                            placeholder="请输入企业电话"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_email">企业邮箱</Label>
                          <Input
                            id="company_email"
                            type="email"
                            value={personalInfo.company_email}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, company_email: e.target.value }))}
                            placeholder="请输入企业邮箱"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_license">营业执照号</Label>
                          <Input
                            id="business_license"
                            value={personalInfo.business_license}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, business_license: e.target.value }))}
                            placeholder="请输入营业执照号"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="company_address">企业地址</Label>
                          <Input
                            id="company_address"
                            value={personalInfo.company_address}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, company_address: e.target.value }))}
                            placeholder="请输入企业地址"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_description">企业简介</Label>
                        <Textarea
                          id="company_description"
                          value={personalInfo.company_description}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, company_description: e.target.value }))}
                          placeholder="请输入企业简介和主营业务"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={savePersonalInfo}
                    disabled={saving || !personalInfo.nickname.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        保存信息
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileManagementPage;