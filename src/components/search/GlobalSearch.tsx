import React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useMaterials } from "@/hooks/useMaterials";

// Helper: format seconds to mm:ss
const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const GlobalSearch: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const { data: products } = useProducts();
  const { data: materials } = useMaterials();

  useEffect(() => {
    if (!open) {
      setValue("");
    }
  }, [open]);

  const handleSearch = (item: any) => {
    setOpen(false);
    setValue("");

    if (item.type === "product") {
      navigate(`/products/${item.id}`);
    } else if (item.type === "video") {
      navigate(`/materials/${item.id}`);
    }
  };

  const items = [];

  if (products) {
    products.forEach((product: any) => {
      items.push({
        id: product.id,
        title: product.standard_chinese_name,
        type: "product",
        image: product.cover_image,
        price: product?.unit_price != null ? Number(product.unit_price) : 0,
      });
    });
  }

  if (materials) {
    materials.forEach((material: any) => {
      items.push({
        id: material.id,
        title: material.title,
        type: "video",
        image: material.thumbnail_url,
        durationLabel: formatDuration(material?.duration_seconds ?? 0),
      });
    });
  }

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? (
          <div>{children}</div>
        ) : (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between md:w-[300px] lg:w-[400px]"
          >
            <Search className="mr-2 h-4 w-4" />
            搜索商品或物料...
            <span className="ml-auto text-muted-foreground">
              {/* cmd + k */}
            </span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 md:w-[300px] lg:w-[400px]">
        <Command>
          <CommandInput
            placeholder="搜索商品或物料..."
            value={value}
            onValueChange={setValue}
          />
          <CommandEmpty>未找到结果。</CommandEmpty>
          <CommandGroup heading="商品">
            {filteredItems
              .filter((item) => item.type === "product")
              .map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSearch(item)}
                  className="flex items-center"
                >
                  {item.title}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="ml-2 h-5 w-5 rounded-full"
                    />
                  ) : null}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="物料">
            {filteredItems
              .filter((item) => item.type === "video")
              .map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSearch(item)}
                  className="flex items-center"
                >
                  {item.title}
                  {item.durationLabel ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.durationLabel}
                    </span>
                  ) : null}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="ml-2 h-5 w-5 rounded-full"
                    />
                  ) : null}
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default GlobalSearch;
