# 产品数据读取原则

**核心原则**: 产品浏览功能已迁移到Global ERP (bugntldehbdyfipzykdd)，不再使用本地products表。历史数据通过JSONB快照形式独立保存，确保数据不可变性。

**AI提示**: 涉及产品相关功能修改时，优先使用globalErpService和product_snapshot快照数据，禁止直接查询本地products表。