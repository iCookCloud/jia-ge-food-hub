import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ShoppingCart, 
  Package, 
  CheckCircle,
  Clock,
  Plus,
  Send,
  FileText,
  Search,
  Filter
} from "lucide-react";

// Mock orders data
const mockOrders = [
  {
    id: "O001",
    customerName: "张记火锅店",
    items: [
      { productName: "新鲜三文鱼片", quantity: 20, unitPrice: 128, total: 2560 }
    ],
    totalAmount: 2560,
    status: "待确认",
    createdAt: "2024-01-16",
    deliveryDate: "2024-01-18",
    notes: "请确保冷链配送"
  },
  {
    id: "O002", 
    customerName: "李家餐厅",
    items: [
      { productName: "优质牛肉卷", quantity: 15, unitPrice: 89, total: 1335 }
    ],
    totalAmount: 1335,
    status: "已确认",
    createdAt: "2024-01-15",
    deliveryDate: "2024-01-17",
    notes: ""
  }
];

const SupplierOrdersPage = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerEmail: "",
    deliveryDate: "",
    items: [{ productName: "", quantity: 1, unitPrice: 0 }],
    notes: ""
  });

  const filteredOrders = orders.filter(order => 
    selectedStatus === "全部" || order.status === selectedStatus
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "待确认":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">待确认</Badge>;
      case "已确认":
        return <Badge variant="default">已确认</Badge>;
      case "配送中":
        return <Badge variant="secondary" className="bg-primary text-primary-foreground">配送中</Badge>;
      case "已完成":
        return <Badge variant="secondary" className="bg-success text-success-foreground">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { productName: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateOrder = () => {
    const orderItems = newOrder.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
    
    const order = {
      id: `O${String(orders.length + 1).padStart(3, '0')}`,
      customerName: newOrder.customerName,
      items: orderItems,
      totalAmount,
      status: "待确认",
      createdAt: new Date().toISOString().split('T')[0],
      deliveryDate: newOrder.deliveryDate,
      notes: newOrder.notes
    };
    
    setOrders(prev => [order, ...prev]);
    setShowCreateOrder(false);
    setNewOrder({
      customerName: "",
      customerEmail: "",
      deliveryDate: "",
      items: [{ productName: "", quantity: 1, unitPrice: 0 }],
      notes: ""
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">订单管理</h1>
            <p className="text-muted-foreground">管理报价订单，跟踪订单状态和配送进度</p>
          </div>
          
          <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                创建报价订单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>创建报价订单</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>客户名称</Label>
                    <Input 
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder(prev => ({...prev, customerName: e.target.value}))}
                      placeholder="请输入客户名称"
                    />
                  </div>
                  <div>
                    <Label>客户邮箱</Label>
                    <Input 
                      type="email"
                      value={newOrder.customerEmail}
                      onChange={(e) => setNewOrder(prev => ({...prev, customerEmail: e.target.value}))}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>期望交期</Label>
                  <Input 
                    type="date"
                    value={newOrder.deliveryDate}
                    onChange={(e) => setNewOrder(prev => ({...prev, deliveryDate: e.target.value}))}
                  />
                </div>

                {/* Order Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>订单商品</Label>
                    <Button variant="outline" size="sm" onClick={addOrderItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加商品
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div>
                          <Label className="text-xs">商品名称</Label>
                          <Input 
                            value={item.productName}
                            onChange={(e) => updateOrderItem(index, 'productName', e.target.value)}
                            placeholder="商品名称"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">数量</Label>
                          <Input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">单价</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItem(index, 'unitPrice', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">小计</Label>
                          <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                            ¥{(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>备注说明</Label>
                  <Textarea 
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({...prev, notes: e.target.value}))}
                    placeholder="配送要求、质量标准等特殊说明..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-semibold">
                    总计: ¥{newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleCreateOrder}>
                      <Send className="h-4 w-4 mr-2" />
                      发送报价订单
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateOrder(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总订单", value: orders.length, icon: ShoppingCart, color: "text-primary" },
            { label: "待确认", value: orders.filter(o => o.status === "待确认").length, icon: Clock, color: "text-warning" },
            { label: "配送中", value: orders.filter(o => o.status === "配送中").length, icon: Package, color: "text-primary" },
            { label: "已完成", value: orders.filter(o => o.status === "已完成").length, icon: CheckCircle, color: "text-success" }
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
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部状态</SelectItem>
                  <SelectItem value="待确认">待确认</SelectItem>
                  <SelectItem value="已确认">已确认</SelectItem>
                  <SelectItem value="配送中">配送中</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>订单列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户信息</TableHead>
                  <TableHead>商品详情</TableHead>
                  <TableHead>订单金额</TableHead>
                  <TableHead>交期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">创建: {order.createdAt}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.productName} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">¥{order.totalAmount}</TableCell>
                    <TableCell>{order.deliveryDate}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                        {order.status === "待确认" && (
                          <Button variant="default" size="sm">
                            确认订单
                          </Button>
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

export default SupplierOrdersPage;