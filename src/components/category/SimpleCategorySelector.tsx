import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChevronDown } from 'lucide-react';
import { useCategoryPaths } from '@/hooks/useCategories';

interface SimpleCategorySelectorProps {
  value?: number | number[];
  onValueChange?: (value: number | number[]) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "选择分类",
  className
}) => {
  const [open, setOpen] = useState(false);
  const { data: categoryPaths, isLoading } = useCategoryPaths();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <span>加载中...</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
      </Button>
    );
  }

  if (!categoryPaths || !Array.isArray(categoryPaths) || categoryPaths.length === 0) {
    return (
      <Button variant="outline" disabled className={className}>
        <span>暂无分类数据</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
      </Button>
    );
  }

  const selectedCategory = categoryPaths.find(cat => cat.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className}
        >
          {selectedCategory ? selectedCategory.name : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="搜索分类..." />
          <CommandList>
            <CommandEmpty>未找到分类</CommandEmpty>
            <CommandGroup>
              {categoryPaths?.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onValueChange?.(category.id);
                    setOpen(false);
                  }}
                >
                  {category.full_path}
                </CommandItem>
              )) || []}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};