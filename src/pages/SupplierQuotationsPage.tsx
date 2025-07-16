import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Clock,
  CheckCircle,
  DollarSign,
  Send,
  Eye
} from "lucide-react";

// Mock supplier quotations data
const mockSupplierQuotations = [
  {
    id: "Q001",
    customerName: "美食餐厅",
    productName: "新鲜三文鱼片 挪威进口", 
    quantity: 50,
    unit: "kg",
    requestedDelivery: "2024-01-20",
    status: "待报价",
    createdAt: "2024-01-15",
    urgency: "普通",
    requirements: "需要当日新鲜，冷链配送"
  },
  {
    id: "Q004",
    customerName: "火锅店",
    productName: "精选大虾 南美白虾",
    quantity: 20,
    unit: "kg", 
    requestedDelivery: "2024-01-22",
    status: "待报价",
    createdAt: "2024-01-16",
    urgency: "紧急",
    requirements: "30-40只/kg规格"
  },
  {
    id: "Q002",
    customerName: "连锁餐厅",
    productName: "优质牛肉卷 火锅专用",
    quantity: 30,
    unit: "kg",
    requestedDelivery: "2024-01-25", 
    status: "已报价",
    createdAt: "2024-01-12",
    quotedPrice: "89.00",
    quotedTotal: "2670.00",
    quotedAt: "2024-01-16"
  }
];

const SupplierQuotationsPage = () => {
  const [quotations, setQuotations] = useState(mockSupplierQuotations);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [quotingItem, setQuotingItem] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "紧急":
        return <Badge variant="destructive" className="text-xs">紧急</Badge>;
      case "非常紧急":
        return <Badge variant="destructive" className="text-xs">非常紧急</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">普通</Badge>;
    }
  };

  const handleSendQuote = () => {
    if (!quotingItem || !quotePrice) return;
    
    const updatedQuotations = quotations.map(q => 
      q.id === quotingItem.id 
        ? { 
            ...q, 
            status: "已报价",
            quotedPrice: quotePrice,
            quotedTotal: (parseFloat(quotePrice) * q.quantity).toFixed(2),
            quotedAt: new Date().toISOString().split('T')[0]
          }
        : q
    );
    
    setQuotations(updatedQuotations);
    setQuotingItem(null);
    setQuotePrice("");
    setQuoteNotes("");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">报价管理</h1>
          <p className="text-muted-foreground">处理客户询价，提供专业报价服务</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "待处理询价", value: quotations.filter(q => q.status === "待报价").length, icon: Clock, color: "text-warning" },
            { label: "已发送报价", value: quotations.filter(q => q.status === "已报价").length, icon: Send, color: "text-primary" },
            { label: "今日新询价", value: 2, icon: FileText, color: "text-success" },
            { label: "本月成交", value: 5, icon: DollarSign, color: "text-brand-orange" }
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部状态</SelectItem>
                  <SelectItem value="待报价">待报价</SelectItem>
                  <SelectItem value="已报价">已报价</SelectItem>
                  <SelectItem value="已成交">已成交</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>客户询价列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>询价单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>商品信息</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>期望交期</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>报价</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-mono">{quotation.id}</TableCell>
                    <TableCell className="font-medium">{quotation.customerName}</TableCell>
                    <TableCell>{quotation.productName}</TableCell>
                    <TableCell>{quotation.quantity}{quotation.unit}</TableCell>
                    <TableCell>{quotation.requestedDelivery}</TableCell>
                    <TableCell>{getUrgencyBadge(quotation.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                    <TableCell>
                      {quotation.quotedPrice ? (
                        <div>
                          <div className="font-semibold">¥{quotation.quotedPrice}/{quotation.unit}</div>
                          <div className="text-sm text-muted-foreground">总计: ¥{quotation.quotedTotal}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {quotation.status === "待报价" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setQuotingItem(quotation)}
                              >
                                报价
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>发送报价 - {quotation.id}</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2">客户需求</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">客户:</span> {quotation.customerName}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">商品:</span> {quotation.productName}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">数量:</span> {quotation.quantity}{quotation.unit}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">交期:</span> {quotation.requestedDelivery}
                                    </div>
                                  </div>
                                  {quotation.requirements && (
                                    <div className="mt-2">
                                      <span className="text-muted-foreground">特殊要求:</span> {quotation.requirements}
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">单价 (¥/{quotation.unit})</label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={quotePrice}
                                      onChange={(e) => setQuotePrice(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">总计</label>
                                    <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                                      ¥{quotePrice ? (parseFloat(quotePrice) * quotation.quantity).toFixed(2) : "0.00"}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">报价说明</label>
                                  <textarea
                                    className="w-full p-3 border border-border rounded-md resize-none"
                                    rows={3}
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                    placeholder="可补充价格说明、交期确认、质量保证等信息..."
                                  />
                                </div>

                                <div className="flex space-x-2 pt-4">
                                  <Button onClick={handleSendQuote} className="flex-1">
                                    <Send className="h-4 w-4 mr-2" />
                                    发送报价
                                  </Button>
                                  <Button variant="outline" onClick={() => setQuotingItem(null)} className="flex-1">
                                    取消
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SupplierQuotationsPage;