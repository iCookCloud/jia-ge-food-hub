-- 插入供应商数据 (无需用户关联)
INSERT INTO supplier_credentials (id, user_id, company_name, business_license, contact_person, contact_phone, contact_email, verification_status, verification_date, created_at, updated_at) VALUES 
-- 奶茶供应商
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '御茶园食品供应链有限公司', 'BL20231001', '王小明', '13800138001', 'contact@yuchayuan.com', 'verified', now(), now(), now()),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '茶颜悦色供应商联盟', 'BL20231002', '李美丽', '13800138002', 'supply@chayanyuese.com', 'verified', now(), now(), now()),

-- 炸鸡供应商  
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '正大炸鸡食材供应商', 'BL20231003', '张强', '13800138003', 'chicken@zhengda.com', 'verified', now(), now(), now()),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '德克士供应链管理', 'BL20231004', '陈晓华', '13800138004', 'supply@dicos.com', 'verified', now(), now(), now()),

-- 拉面供应商
('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '一兰拉面食材批发', 'BL20231005', '田中健', '13800138005', 'ramen@ichiran.com', 'verified', now(), now(), now()),
('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '味千拉面供应商', 'BL20231006', '佐藤雅', '13800138006', 'supply@ajisen.com', 'verified', now(), now(), now()),

-- 寿司供应商
('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '元气寿司食材供应', 'BL20231007', '山田花子', '13800138007', 'sushi@genki.com', 'verified', now(), now(), now()),
('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '争鲜回转寿司供应链', 'BL20231008', '小林优子', '13800138008', 'fresh@sushi.com', 'verified', now(), now(), now()),

-- 火锅供应商
('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', '海底捞食材供应商', 'BL20231009', '刘大伟', '13800138009', 'hotpot@haidilao.com', 'verified', now(), now(), now()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '巴奴毛肚火锅供应链', 'BL20231010', '赵雪梅', '13800138010', 'supply@banu.com', 'verified', now(), now(), now());

-- 插入商品数据 (无需用户关联，将user_id设为null)
INSERT INTO products (id, sku, standard_english_name, standard_chinese_name, category_english, category_chinese, unit_price, unit, specifications, is_active, user_id, created_at, updated_at) VALUES 
-- 奶茶类商品
('MT001', 'MT001', 'Premium Black Tea Leaves', '优质红茶叶', 'Tea & Coffee', '奶茶咖啡', '45.00', '包', '500g/包, 20包/箱', true, null, now(), now()),
('MT002', 'MT002', 'Tapioca Pearls', '珍珠粉圆', 'Tea & Coffee', '奶茶咖啡', '35.00', '袋', '3kg/袋, 6袋/箱', true, null, now(), now()),
('MT003', 'MT003', 'Non-dairy Creamer', '奶精粉', 'Tea & Coffee', '奶茶咖啡', '28.00', '袋', '1kg/袋, 20袋/箱', true, null, now(), now()),
('MT004', 'MT004', 'Fruit Flavored Syrup', '水果味糖浆', 'Tea & Coffee', '奶茶咖啡', '42.00', '瓶', '2.5kg/瓶, 6瓶/箱', true, null, now(), now()),

-- 炸鸡类商品  
('ZJ001', 'ZJ001', 'Chicken Wings', '鸡翅', 'Poultry', '禽肉类', '32.00', '包', '1kg/包, 10包/箱', true, null, now(), now()),
('ZJ002', 'ZJ002', 'Chicken Drumsticks', '鸡腿', 'Poultry', '禽肉类', '38.00', '包', '1kg/包, 10包/箱', true, null, now(), now()),
('ZJ003', 'ZJ003', 'Fried Chicken Coating', '炸鸡粉', 'Seasoning', '调料类', '25.00', '袋', '1kg/袋, 20袋/箱', true, null, now(), now()),
('ZJ004', 'ZJ004', 'Chicken Marinade', '鸡肉腌料', 'Seasoning', '调料类', '18.00', '袋', '500g/袋, 30袋/箱', true, null, now(), now()),

-- 拉面类商品
('LM001', 'LM001', 'Fresh Ramen Noodles', '新鲜拉面', 'Noodles', '面条类', '22.00', '份', '130g/份, 50份/箱', true, null, now(), now()),
('LM002', 'LM002', 'Tonkotsu Ramen Broth', '豚骨拉面汤底', 'Soup Base', '汤底类', '55.00', '包', '1kg/包, 10包/箱', true, null, now(), now()),
('LM003', 'LM003', 'Chashu Pork', '叉烧肉', 'Meat', '肉类', '68.00', '包', '500g/包, 12包/箱', true, null, now(), now()),
('LM004', 'LM004', 'Bamboo Shoots', '竹笋丝', 'Vegetables', '蔬菜类', '15.00', '袋', '200g/袋, 40袋/箱', true, null, now(), now()),

-- 寿司类商品
('SS001', 'SS001', 'Sushi Rice', '寿司米', 'Rice', '米类', '35.00', '袋', '5kg/袋, 8袋/箱', true, null, now(), now()),
('SS002', 'SS002', 'Fresh Salmon', '新鲜三文鱼', 'Seafood', '海鲜类', '150.00', 'kg', '1kg装, 冷链配送', true, null, now(), now()),
('SS003', 'SS003', 'Nori Seaweed', '紫菜片', 'Seaweed', '海藻类', '28.00', '包', '50片/包, 20包/箱', true, null, now(), now()),
('SS004', 'SS004', 'Wasabi Paste', '芥末酱', 'Condiment', '调味品', '45.00', '管', '43g/管, 20管/箱', true, null, now(), now()),

-- 火锅类商品
('HG001', 'HG001', 'Hot Pot Base Sauce', '火锅底料', 'Sauce', '调料类', '32.00', '包', '500g/包, 20包/箱', true, null, now(), now()),
('HG002', 'HG002', 'Beef Slices', '牛肉片', 'Beef', '牛肉类', '85.00', '盒', '250g/盒, 20盒/箱', true, null, now(), now()),
('HG003', 'HG003', 'Fresh Tofu', '嫩豆腐', 'Tofu', '豆制品', '12.00', '盒', '500g/盒, 30盒/箱', true, null, now(), now()),
('HG004', 'HG004', 'Mushroom Mix', '菌菇拼盘', 'Mushroom', '菌菇类', '25.00', '盒', '300g/盒, 24盒/箱', true, null, now(), now());