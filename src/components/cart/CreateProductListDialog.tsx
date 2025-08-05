import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProductListFromCart } from "@/hooks/useProductLists";
import { CartItem } from "@/hooks/useCart";

interface CreateProductListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onSuccess: () => void;
}

export function CreateProductListDialog({ 
  open, 
  onOpenChange, 
  cartItems, 
  onSuccess 
}: CreateProductListDialogProps) {
  const [name, setName] = useState("");
  const createMutation = useCreateProductListFromCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createMutation.mutateAsync({ cartItems, name: name.trim() });
      setName("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.price) * item.quantity), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建货单</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">货单名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入货单名称"
              className="mt-1"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>商品数量：</span>
              <span>{cartItems.length} 种</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>总数量：</span>
              <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>总金额：</span>
              <span>¥{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "创建中..." : "创建货单"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}