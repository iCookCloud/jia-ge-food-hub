import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  User,
  Send
} from "lucide-react";
import { QuotationChat } from "@/components/quotations/QuotationChat";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// Types
interface Quotation {
  id: string;
  productName: string;
  supplierName: string;
  quantity: number;
  unit: string;
  requestedDelivery: string;
  status: string;
  createdAt: string;
  urgency: string;
  estimatedAmount?: string;
  quotedAmount?: string;
  finalAmount?: string;
}

// Mock quotations data
const mockQuotations: Quotation[] = [
  {
    id: "Q001",
    productName: "新鲜三文鱼片 挪威进口",
    supplierName: "海鲜直供",
    quantity: 50,
    unit: "kg",
    requestedDelivery: "2024-01-20",
    status: "待报价",
    createdAt: "2024-01-15",
    urgency: "普通",
    estimatedAmount: "6400.00"
  },
  {
    id: "Q002", 
    productName: "优质牛肉卷 火锅专用",
    supplierName: "优质肉类",
    quantity: 30,
    unit: "kg",
    requestedDelivery: "2024-01-25",
    status: "已报价",
    createdAt: "2024-01-12",
    urgency: "紧急",
    quotedAmount: "2670.00",
    estimatedAmount: "2700.00"
  },
  {
    id: "Q003",
    productName: "有机蔬菜拼盘",
    supplierName: "绿色农场",
    quantity: 100,
    unit: "份",
    requestedDelivery: "2024-01-18",
    status: "已成交",
    createdAt: "2024-01-10",
    urgency: "普通",
    finalAmount: "3500.00"
  }
];

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState(mockQuotations);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [showNewQuotationDialog, setShowNewQuotationDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("quotations");
  const [newMessage, setNewMessage] = useState("");
  
  const { data: messages = [] } = useMessages();
  const sendMessage = useSendMessage();
  
  const [newQuotation, setNewQuotation] = useState({
    productName: "",
    supplierName: "",
    quantity: "",
    unit: "kg",
    requestedDelivery: "",
    urgency: "普通",
    requirements: ""
  });

  const filteredQuotations = quotations.filter(q => 
    selectedStatus === "全部" || q.status === selectedStatus
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "待报价":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">待报价</Badge>;
      case "已报价":
        return <Badge variant="default">已报价</Badge>;
      case "已成交":
        return <Badge variant="secondary" className="bg-success text-success-foreground">已成交</Badge>;
      case "失效":
        return <Badge variant="destructive">失效</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateQuotation = () => {
    const newId = `Q${String(quotations.length + 1).padStart(3, '0')}`;
    const quotation: Quotation = {
      id: newId,
      productName: newQuotation.productName,
      supplierName: newQuotation.supplierName,
      quantity: parseInt(newQuotation.quantity),
      unit: newQuotation.unit,
      requestedDelivery: newQuotation.requestedDelivery,
      status: "待报价",
      createdAt: new Date().toISOString().split('T')[0],
      urgency: newQuotation.urgency,
      estimatedAmount: (parseFloat(newQuotation.quantity) * 100).toFixed(2) // Mock calculation
    };
    
    setQuotations(prev => [quotation, ...prev]);
    setShowNewQuotationDialog(false);
    setNewQuotation({
      productName: "",
      supplierName: "",
      quantity: "",
      unit: "kg", 
      requestedDelivery: "",
      urgency: "普通",
      requirements: ""
    });
  };

  const handleOpenChat = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowChatDialog(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">询价中心</h1>
            <p className="text-muted-foreground">管理询价单，供应商联系和沟通记录</p>
          </div>
          
          <Dialog open={showNewQuotationDialog} onOpenChange={setShowNewQuotationDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                发起询价
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>发起新询价</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>商品名称</Label>
                    <Input 
                      value={newQuotation.productName}
                      onChange={(e) => setNewQuotation(prev => ({...prev, productName: e.target.value}))}
                      placeholder="请输入商品名称"
                    />
                  </div>
                  <div>
                    <Label>目标供应商</Label>
                    <Select value={newQuotation.supplierName} onValueChange={(value) => setNewQuotation(prev => ({...prev, supplierName: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择供应商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="海鲜直供">海鲜直供</SelectItem>
                        <SelectItem value="优质肉类">优质肉类</SelectItem>
                        <SelectItem value="绿色农场">绿色农场</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>采购数量</Label>
                    <Input 
                      type="number"
                      value={newQuotation.quantity}
                      onChange={(e) => setNewQuotation(prev => ({...prev, quantity: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>单位</Label>
                    <Select value={newQuotation.unit} onValueChange={(value) => setNewQuotation(prev => ({...prev, unit: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">千克</SelectItem>
                        <SelectItem value="份">份</SelectItem>
                        <SelectItem value="盒">盒</SelectItem>
                        <SelectItem value="套">套</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>期望交期</Label>
                    <Input 
                      type="date"
                      value={newQuotation.requestedDelivery}
                      onChange={(e) => setNewQuotation(prev => ({...prev, requestedDelivery: e.target.value}))}
                    />
                  </div>
                </div>

                <div>
                  <Label>紧急程度</Label>
                  <Select value={newQuotation.urgency} onValueChange={(value) => setNewQuotation(prev => ({...prev, urgency: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="普通">普通</SelectItem>
                      <SelectItem value="紧急">紧急</SelectItem>
                      <SelectItem value="非常紧急">非常紧急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>特殊要求</Label>
                  <Textarea 
                    value={newQuotation.requirements}
                    onChange={(e) => setNewQuotation(prev => ({...prev, requirements: e.target.value}))}
                    placeholder="请描述特殊要求、质量标准等..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleCreateQuotation} className="flex-1">
                    发送询价
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewQuotationDialog(false)} className="flex-1">
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总询价单", value: quotations.length, icon: FileText, color: "text-primary" },
            { label: "待报价", value: quotations.filter(q => q.status === "待报价").length, icon: Clock, color: "text-warning" },
            { label: "已报价", value: quotations.filter(q => q.status === "已报价").length, icon: CheckCircle, color: "text-primary" },
            { label: "已成交", value: quotations.filter(q => q.status === "已成交").length, icon: CheckCircle, color: "text-success" }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 主要内容区域 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quotations">询价单</TabsTrigger>
            <TabsTrigger value="suppliers">供应商联系</TabsTrigger>
            <TabsTrigger value="messages">沟通记录</TabsTrigger>
          </TabsList>

          {/* 询价单列表 */}
          <TabsContent value="quotations" className="mt-6">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Label>状态筛选:</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部状态</SelectItem>
                      <SelectItem value="待报价">待报价</SelectItem>
                      <SelectItem value="已报价">已报价</SelectItem>
                      <SelectItem value="已成交">已成交</SelectItem>
                      <SelectItem value="失效">失效</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 卡片式询价单列表 */}
            <div className="space-y-4">
              {filteredQuotations.map((quotation) => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* 左侧信息 */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-muted-foreground">{quotation.id}</span>
                              {getStatusBadge(quotation.status)}
                            </div>
                            <h3 className="font-semibold text-lg text-foreground">{quotation.productName}</h3>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">供应商</p>
                            <p className="font-medium">{quotation.supplierName}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">采购数量</p>
                            <p className="font-medium">{quotation.quantity}{quotation.unit}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">期望交期</p>
                            <p className="font-medium">{quotation.requestedDelivery}</p>
                          </div>
                        </div>
                      </div>

                      {/* 右侧金额和操作 */}
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="text-right lg:text-left">
                          <p className="text-sm text-muted-foreground">金额</p>
                          <p className="text-2xl font-bold text-primary">
                            ¥{quotation.quotedAmount || quotation.finalAmount || quotation.estimatedAmount}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenChat(quotation)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            沟通
                          </Button>
                          {quotation.status === "已报价" && (
                            <Button variant="default" size="sm">
                              加入订单
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredQuotations.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">暂无询价单</h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedStatus !== "全部" ? `暂无${selectedStatus}询价单` : "还没有创建任何询价单"}
                    </p>
                    <Button onClick={() => setShowNewQuotationDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      发起询价
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 供应商联系 */}
          <TabsContent value="suppliers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {["海鲜直供", "优质肉类", "绿色农场"].map((supplier, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{supplier}</CardTitle>
                        <p className="text-sm text-muted-foreground">优质供应商</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>联系人: 张经理</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>13800138000</span>
                        <Button variant="outline" size="sm">拨打</Button>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>supplier@example.com</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          发消息
                        </Button>
                        <Button variant="default" size="sm" className="flex-1">
                          新询价
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>合作询价: 5次</p>
                        <p>成交订单: 3次</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 沟通记录 */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>询价沟通记录</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无沟通记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <Card key={message.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender_profile?.avatar_url} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {message.sender_profile?.nickname || '用户'}
                                  </span>
                                  {message.quotation && (
                                    <Badge variant="outline" className="text-xs">
                                      {message.quotation.sheet_name || '询价单'}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                    locale: zhCN
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 询价沟通对话框 */}
        {selectedQuotation && (
          <QuotationChat
            quotationId={selectedQuotation.id}
            supplierId="mock-supplier-id" // 这里应该从实际数据获取
            supplierName={selectedQuotation.supplierName}
            quotationTitle={selectedQuotation.productName}
            open={showChatDialog}
            onOpenChange={setShowChatDialog}
          />
        )}
      </div>
    </Layout>
  );
};

export default QuotationsPage;