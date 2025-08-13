# 供应链设计一体化功能集成规划

## 1. 项目概述

### 1.1 集成目标
在现有餐饮设计通平台基础上，将供应链管理与设计展示深度融合，形成"设计案例 → 关联商品 → 供应链对接"的完整业务闭环。

### 1.2 核心原则
- **保持现有框架**：不改变当前的技术架构和页面结构
- **数据源优先级**：优先使用 globalErpService 和 product_snapshot 快照数据
- **业务流程融合**：设计案例与商品推荐无缝衔接
- **用户体验优化**：简化操作流程，提升转化效率

## 2. 功能集成架构

### 2.1 数据架构调整

#### 2.1.1 ERP数据集成
```typescript
// 使用 globalErpService 作为主要数据源
interface ProductSnapshot {
  id: string;
  name: string;
  category: string;
  price: number;
  supplier_info: SupplierInfo;
  design_compatibility: DesignStyle[]; // 兼容的设计风格
  case_references: string[]; // 关联的案例ID
  images: string[];
  specifications: Record<string, any>;
}

interface SupplierInfo {
  supplier_id: string;
  supplier_name: string;
  contact_info: ContactInfo;
  delivery_info: DeliveryInfo;
  quality_rating: number;
}
```

#### 2.1.2 案例商品关联
```typescript
interface DesignCase {
  // 现有字段保持不变
  id: string;
  title: string;
  style: string;
  // 新增关联字段
  recommended_products: ProductRecommendation[];
  supply_chain_info: SupplyChainInfo;
  estimated_cost: CostEstimation;
}

interface ProductRecommendation {
  product_id: string;
  category: string;
  priority: number; // 推荐优先级
  usage_description: string; // 在案例中的使用说明
  quantity_suggestion: number; // 建议采购数量
}
```

### 2.2 页面功能扩展

#### 2.2.1 CasesTab 增强
**现有功能保持**：
- 案例展示和筛选
- 设计师信息
- 收藏功能

**新增功能**：
1. **关联商品展示**
   - 案例详情页新增"推荐材料"区域
   - 显示案例中使用的主要材料和设备
   - 一键添加推荐商品到购物车

2. **成本预估工具**
   - 基于案例面积和风格自动计算材料成本
   - 显示不同价位区间的材料选择
   - 提供成本明细分解

3. **供应商信息**
   - 显示推荐材料的供应商信息
   - 供应商评级和服务范围
   - 直接联系供应商功能

#### 2.2.2 MaterialsTab 增强
**现有功能保持**：
- 商品展示和分类
- 购物车功能
- 价格展示

**新增功能**：
1. **案例关联展示**
   - 商品详情页显示"应用案例"
   - 展示使用该商品的设计案例
   - 案例风格标签匹配

2. **设计兼容性标识**
   - 商品标注适合的设计风格
   - 风格筛选功能
   - 智能推荐相关商品

3. **供应链信息**
   - 供应商详细信息展示
   - 库存状态和交货期
   - 批量采购优惠信息

## 3. 核心功能实现

### 3.1 智能商品推荐系统

#### 3.1.1 推荐算法
```typescript
class ProductRecommendationEngine {
  // 基于案例风格匹配商品
  getProductsByStyle(style: string): ProductSnapshot[] {
    return globalErpService.getProductsByDesignStyle(style);
  }
  
  // 基于用户浏览历史推荐
  getPersonalizedRecommendations(userId: string): ProductSnapshot[] {
    // 分析用户收藏的案例和商品
    // 推荐相似风格的商品
  }
  
  // 基于案例预算区间推荐
  getProductsByBudget(caseId: string, budget: number): ProductSnapshot[] {
    // 根据预算范围推荐合适的商品组合
  }
}
```

#### 3.1.2 关联度计算
- **风格匹配度**：案例风格与商品适用风格的匹配程度
- **价格合理性**：商品价格与案例定位的匹配度
- **使用频率**：商品在同类案例中的使用频率
- **用户偏好**：基于用户历史行为的个性化权重

### 3.2 供应链对接功能

#### 3.2.1 供应商管理
```typescript
interface SupplierProfile {
  id: string;
  name: string;
  business_license: string;
  service_areas: string[]; // 服务区域
  product_categories: string[]; // 主营产品类别
  quality_certifications: string[]; // 质量认证
  delivery_capabilities: DeliveryInfo;
  contact_methods: ContactMethod[];
  rating_info: RatingInfo;
}

interface DeliveryInfo {
  regions: string[];
  lead_time: number; // 交货期（天）
  minimum_order: number; // 最小起订量
  shipping_cost: number;
  bulk_discount: BulkDiscountRule[];
}
```

#### 3.2.2 订单管理增强
```typescript
interface SupplyChainOrder {
  // 继承现有订单结构
  base_order: Order;
  
  // 新增供应链字段
  supplier_orders: SupplierOrder[]; // 按供应商拆分的子订单
  design_case_reference: string; // 关联的设计案例
  estimated_delivery: Date;
  installation_service: boolean; // 是否需要安装服务
  project_timeline: ProjectTimeline;
}

interface SupplierOrder {
  supplier_id: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  tracking_info: TrackingInfo;
  communication_log: CommunicationRecord[];
}
```

### 3.3 集成业务流程

#### 3.3.1 用户使用流程
1. **浏览案例** → CasesTab 查看设计案例
2. **查看材料** → 案例详情页显示推荐材料
3. **比较选择** → MaterialsTab 详细比较商品
4. **添加购物车** → 一键添加或批量添加
5. **供应商对接** → 查看供应商信息，直接沟通
6. **下单采购** → 统一下单，按供应商拆分
7. **项目跟踪** → 订单状态和项目进度跟踪

#### 3.3.2 数据流程
```typescript
// 案例浏览 → 商品推荐流程
class IntegratedWorkflow {
  async getCaseWithProducts(caseId: string) {
    // 1. 获取案例基础信息
    const designCase = await casesService.getCase(caseId);
    
    // 2. 通过 globalErpService 获取推荐商品
    const recommendedProducts = await globalErpService
      .getRecommendedProducts({
        style: designCase.style,
        category: designCase.category,
        budget_range: designCase.estimated_budget
      });
    
    // 3. 获取供应商信息
    const suppliers = await Promise.all(
      recommendedProducts.map(product => 
        globalErpService.getSupplierInfo(product.supplier_id)
      )
    );
    
    return {
      case: designCase,
      products: recommendedProducts,
      suppliers: suppliers
    };
  }
}
```

## 4. 技术实现细节

### 4.1 服务层扩展

#### 4.1.1 GlobalErpService 集成
```typescript
// 扩展现有 globalErpService
class EnhancedGlobalErpService extends GlobalErpService {
  // 根据设计风格获取商品
  async getProductsByDesignStyle(style: string): Promise<ProductSnapshot[]> {
    return this.query('product_snapshot', {
      design_compatibility: { contains: [style] }
    });
  }
  
  // 获取案例关联商品
  async getCaseRelatedProducts(caseId: string): Promise<ProductSnapshot[]> {
    return this.query('product_snapshot', {
      case_references: { contains: [caseId] }
    });
  }
  
  // 批量获取供应商信息
  async getSuppliersByIds(supplierIds: string[]): Promise<SupplierProfile[]> {
    return this.query('supplier_profiles', {
      id: { in: supplierIds }
    });
  }
}
```

#### 4.1.2 RecommendationService 新增
```typescript
class RecommendationService {
  constructor(
    private erpService: EnhancedGlobalErpService,
    private userService: UserService
  ) {}
  
  async getRecommendationsForCase(
    caseId: string, 
    userId?: string
  ): Promise<ProductRecommendation[]> {
    // 获取案例信息
    const designCase = await this.casesService.getCase(caseId);
    
    // 基于风格推荐
    const styleProducts = await this.erpService
      .getProductsByDesignStyle(designCase.style);
    
    // 个性化推荐（如果用户已登录）
    let personalizedProducts = [];
    if (userId) {
      const userPreferences = await this.userService
        .getUserPreferences(userId);
      personalizedProducts = await this.getPersonalizedProducts(
        userPreferences, designCase.style
      );
    }
    
    // 合并并排序推荐结果
    return this.mergeAndRankRecommendations(
      styleProducts, 
      personalizedProducts,
      designCase
    );
  }
}
```

### 4.2 组件扩展

#### 4.2.1 CaseDetail 组件增强
```tsx
// 扩展现有 CaseDetail 组件
interface CaseDetailProps {
  // 现有 props 保持不变
  case: DesignCase;
  // 新增 props
  showRecommendations?: boolean;
  onProductSelect?: (product: ProductSnapshot) => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ 
  case: designCase, 
  showRecommendations = true,
  onProductSelect 
}) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  
  // 获取推荐商品
  useEffect(() => {
    if (showRecommendations) {
      loadRecommendations();
    }
  }, [designCase.id]);
  
  return (
    <div className="case-detail">
      {/* 现有案例展示内容保持不变 */}
      <CaseImageGallery images={designCase.images} />
      <CaseInfo case={designCase} />
      
      {/* 新增推荐材料区域 */}
      {showRecommendations && (
        <RecommendedMaterials
          recommendations={recommendations}
          suppliers={suppliers}
          onProductSelect={onProductSelect}
        />
      )}
      
      {/* 新增成本预估区域 */}
      <CostEstimation case={designCase} />
    </div>
  );
};
```

#### 4.2.2 RecommendedMaterials 新组件
```tsx
interface RecommendedMaterialsProps {
  recommendations: ProductRecommendation[];
  suppliers: SupplierProfile[];
  onProductSelect: (product: ProductSnapshot) => void;
}

const RecommendedMaterials: React.FC<RecommendedMaterialsProps> = ({
  recommendations,
  suppliers,
  onProductSelect
}) => {
  return (
    <section className="recommended-materials">
      <h3>推荐材料</h3>
      
      <div className="materials-grid">
        {recommendations.map(rec => (
          <MaterialCard
            key={rec.product_id}
            product={rec.product}
            supplier={suppliers.find(s => s.id === rec.product.supplier_id)}
            usage={rec.usage_description}
            onSelect={() => onProductSelect(rec.product)}
            onAddToCart={() => handleAddToCart(rec.product)}
            onContactSupplier={() => handleContactSupplier(rec.product.supplier_id)}
          />
        ))}
      </div>
      
      <div className="bulk-actions">
        <Button onClick={handleAddAllToCart}>
          一键添加全部到购物车
        </Button>
        <Button onClick={handleGetQuote}>
          获取整体报价
        </Button>
      </div>
    </section>
  );
};
```

### 4.3 数据库扩展

#### 4.3.1 新增数据表
```sql
-- 商品快照表（使用 globalErpService）
-- 这个表主要用于缓存和关联，实际数据来源于 ERP 系统

-- 案例商品关联表
CREATE TABLE case_product_associations (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES design_cases(id),
  product_id VARCHAR(50), -- ERP 系统中的商品 ID
  category VARCHAR(50),
  priority INTEGER DEFAULT 0,
  usage_description TEXT,
  quantity_suggestion INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商评价表
CREATE TABLE supplier_ratings (
  id SERIAL PRIMARY KEY,
  supplier_id VARCHAR(50),
  user_id UUID REFERENCES auth.users(id),
  order_id INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户商品偏好表
CREATE TABLE user_product_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_category VARCHAR(50),
  style_preference VARCHAR(50),
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  brand_preferences TEXT[], -- 偏好品牌数组
  quality_priority INTEGER DEFAULT 5, -- 质量重要程度 1-10
  price_priority INTEGER DEFAULT 5,   -- 价格重要程度 1-10
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.3.2 现有表扩展
```sql
-- 扩展设计案例表
ALTER TABLE design_cases ADD COLUMN IF NOT EXISTS estimated_budget_min DECIMAL(10,2);
ALTER TABLE design_cases ADD COLUMN IF NOT EXISTS estimated_budget_max DECIMAL(10,2);
ALTER TABLE design_cases ADD COLUMN IF NOT EXISTS material_list TEXT[]; -- 主要材料列表
ALTER TABLE design_cases ADD COLUMN IF NOT EXISTS supplier_recommendations TEXT[]; -- 推荐供应商ID列表

-- 扩展订单表
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_case_id INTEGER REFERENCES design_cases(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS project_type VARCHAR(50); -- 'design_project' | 'material_only'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installation_required BOOLEAN DEFAULT FALSE;
```

## 5. API 接口设计

### 5.1 案例相关 API 扩展
```typescript
// 获取案例及推荐商品
GET /api/cases/:id/complete
Response: {
  case: DesignCase,
  recommended_products: ProductRecommendation[],
  suppliers: SupplierProfile[],
  cost_estimation: CostEstimation
}

// 获取案例成本预估
GET /api/cases/:id/cost-estimation?budget_level=high|medium|low
Response: CostEstimation

// 更新案例商品关联
POST /api/cases/:id/products
Body: {
  product_id: string,
  usage_description: string,
  priority: number
}
```

### 5.2 供应链相关 API
```typescript
// 获取供应商信息
GET /api/suppliers/:id
Response: SupplierProfile

// 获取供应商商品列表
GET /api/suppliers/:id/products
Response: ProductSnapshot[]

// 供应商评价
POST /api/suppliers/:id/ratings
Body: SupplierRatingInput

// 批量获取商品信息（通过 ERP）
POST /api/products/batch
Body: { product_ids: string[] }
Response: ProductSnapshot[]
```

### 5.3 推荐系统 API
```typescript
// 获取个性化推荐
GET /api/recommendations/products?style=:style&category=:category&user_id=:userId
Response: ProductRecommendation[]

// 获取案例相关推荐
GET /api/recommendations/cases/:caseId/products
Response: ProductRecommendation[]

// 更新用户偏好
POST /api/user/preferences
Body: UserProductPreferences
```

## 6. 实施计划

### 6.1 Phase 1: 基础数据集成（第1-2周）
1. **数据库扩展**
   - 创建关联表和扩展现有表
   - 设置数据迁移脚本
   
2. **ERP 服务集成**
   - 扩展 globalErpService 功能
   - 实现商品快照数据同步
   
3. **基础 API 开发**
   - 商品查询接口
   - 供应商信息接口

### 6.2 Phase 2: 推荐系统开发（第3-4周）
1. **推荐算法实现**
   - 基于风格的商品推荐
   - 基于案例的关联推荐
   
2. **用户偏好系统**
   - 用户行为跟踪
   - 偏好学习算法
   
3. **推荐 API 开发**
   - 个性化推荐接口
   - 案例关联推荐接口

### 6.3 Phase 3: 前端功能开发（第5-6周）
1. **案例页面增强**
   - RecommendedMaterials 组件
   - CostEstimation 组件
   
2. **商品页面增强**
   - 案例关联展示
   - 供应商信息展示
   
3. **新增功能页面**
   - 供应商详情页
   - 项目管理页面

### 6.4 Phase 4: 供应链功能开发（第7-8周）
1. **供应商管理**
   - 供应商注册和认证
   - 供应商评价系统
   
2. **订单管理增强**
   - 多供应商订单拆分
   - 项目进度跟踪
   
3. **沟通系统**
   - 与供应商的实时沟通
   - 项目协调功能

### 6.5 Phase 5: 测试和优化（第9-10周）
1. **功能测试**
   - 端到端测试
   - 性能测试
   
2. **用户体验优化**
   - 界面优化
   - 流程简化
   
3. **数据验证**
   - 推荐准确性验证
   - 供应链数据一致性检查

## 7. 风险评估与应对

### 7.1 技术风险
**风险**：ERP 数据同步延迟或失败
**应对**：
- 实现数据缓存机制
- 设置数据同步监控
- 提供手动同步功能

**风险**：推荐算法准确性不足
**应对**：
- 设置A/B测试框架
- 收集用户反馈数据
- 持续优化推荐模型

### 7.2 业务风险
**风险**：供应商数据质量问题
**应对**：
- 建立供应商审核机制
- 设置数据质量检查
- 提供用户举报功能

**风险**：用户体验复杂化
**应对**：
- 保持现有功能的简洁性
- 渐进式引入新功能
- 提供功能开关控制

### 7.3 数据风险
**风险**：商品价格信息不准确
**应对**：
- 实时同步价格信息
- 设置价格变动提醒
- 提供价格历史记录

## 8. 成功指标

### 8.1 技术指标
- **数据同步成功率** > 99%
- **推荐系统响应时间** < 500ms
- **页面加载时间** < 3s
- **API 可用性** > 99.9%

### 8.2 业务指标
- **案例到商品转化率** > 15%
- **推荐商品点击率** > 10%
- **供应商联系转化率** > 5%
- **项目完成度** > 90%

### 8.3 用户体验指标
- **用户停留时间**增长 > 30%
- **用户路径完成率** > 80%
- **用户满意度评分** > 4.0/5.0
- **用户投诉率** < 2%

## 9. 总结

本集成方案将在保持现有系统稳定性的基础上，无缝融合供应链和设计功能，形成完整的业务闭环。通过智能推荐系统和供应商对接功能，为用户提供从设计灵感到材料采购的一站式服务，提升平台的商业价值和用户体验。

关键成功因素：
1. **数据质量**：确保 ERP 数据的准确性和实时性
2. **推荐精度**：持续优化推荐算法，提高匹配度
3. **供应商质量**：建立完善的供应商管理和评价体系
4. **用户体验**：保持界面简洁，流程顺畅
5. **系统稳定性**：确保新功能不影响现有系统的稳定运行