-- Add user_id to product_lists table for ownership
ALTER TABLE public.product_lists 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add missing columns for better functionality
ALTER TABLE public.product_lists 
ADD COLUMN total_amount NUMERIC DEFAULT 0,
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'expired'));

-- Update RLS policies for product_lists
DROP POLICY IF EXISTS "Users can manage product lists" ON public.product_lists;

CREATE POLICY "Users can view their own product lists" 
ON public.product_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product lists" 
ON public.product_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product lists" 
ON public.product_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product lists" 
ON public.product_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update RLS policies for product_list_items
DROP POLICY IF EXISTS "Users can manage product list items" ON public.product_list_items;

CREATE POLICY "Users can view items of their product lists" 
ON public.product_list_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.product_lists 
  WHERE product_lists.id = product_list_items.product_list_id 
  AND product_lists.user_id = auth.uid()
));

CREATE POLICY "Users can create items for their product lists" 
ON public.product_list_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.product_lists 
  WHERE product_lists.id = product_list_items.product_list_id 
  AND product_lists.user_id = auth.uid()
));

CREATE POLICY "Users can update items of their product lists" 
ON public.product_list_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.product_lists 
  WHERE product_lists.id = product_list_items.product_list_id 
  AND product_lists.user_id = auth.uid()
));

CREATE POLICY "Users can delete items of their product lists" 
ON public.product_list_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.product_lists 
  WHERE product_lists.id = product_list_items.product_list_id 
  AND product_lists.user_id = auth.uid()
));

-- Add missing columns to product_list_items
ALTER TABLE public.product_list_items 
ADD COLUMN quantity INTEGER DEFAULT 1,
ADD COLUMN unit_price NUMERIC DEFAULT 0;