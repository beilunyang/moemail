# 卡密清理功能使用指南

## 🎯 功能概述

新增了两个重要的卡密管理功能：

1. **过期卡密自动删除** - 定时清理过期的卡密
2. **卡密状态重置** - 当临时账号被删除时，关联的卡密状态重置为未使用

## 🔧 功能详情

### 1. 过期卡密自动删除

#### 自动清理机制
- **定时任务**: 每天凌晨2点自动执行
- **清理对象**: 所有过期的卡密（无论是否已使用）
- **清理方式**: 完全删除过期卡密记录

#### 手动清理
- **管理界面**: 在卡密管理页面点击"清理过期卡密"按钮
- **API接口**: `POST /api/cleanup/card-keys`
- **权限要求**: 只有皇帝角色可以执行

### 2. 卡密状态重置

#### 触发条件
- 临时账号过期被自动删除
- 手动删除临时账号

#### 重置行为
- 将卡密的 `isUsed` 状态从 `true` 改为 `false`
- 清空 `usedBy` 和 `usedAt` 字段
- 卡密可以重新使用

### 3. 优化的删除逻辑

#### 新的删除规则
- ✅ **未使用的卡密**: 随时可以删除
- ✅ **已使用且过期的卡密**: 可以删除
- ❌ **已使用且未过期的卡密**: 不能删除

#### 前端显示
- 显示卡密的使用状态和过期状态
- 过期卡密显示红色"已过期"标签
- 只有可删除的卡密才显示删除按钮

## 🚀 部署配置

### 1. 配置Cloudflare Worker定时任务

1. **复制配置文件**:
   ```bash
   cp wrangler.card-key-cleanup.example.json wrangler.card-key-cleanup.json
   ```

2. **修改配置**:
   ```json
   {
     "vars": {
       "SITE_URL": "https://your-actual-domain.com"
     },
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "your-actual-database-name",
         "database_id": "your-actual-database-id"
       }
     ]
   }
   ```

3. **部署Worker**:
   ```bash
   # 自动部署（包含在主部署脚本中）
   pnpm dlx tsx scripts/deploy/index.ts
   
   # 或单独部署
   pnpm dlx wrangler deploy --config wrangler.card-key-cleanup.json
   ```

### 2. 验证部署

1. **检查定时任务**:
   ```bash
   wrangler cron trigger --cron="0 2 * * *" card-key-cleanup-worker
   ```

2. **手动触发测试**:
   ```bash
   curl -X POST https://card-key-cleanup-worker.your-account.workers.dev/
   ```

## 📊 监控和日志

### 1. 查看清理日志

- **Cloudflare Dashboard**: Workers → card-key-cleanup-worker → Logs
- **实时日志**: `wrangler tail card-key-cleanup-worker`

### 2. 获取清理统计

```bash
# 获取过期卡密统计
curl https://your-domain.com/api/cleanup/card-keys
```

响应示例：
```json
{
  "success": true,
  "data": {
    "expiredCount": 5,
    "totalCount": 100,
    "lastChecked": "2024-01-01T02:00:00.000Z"
  }
}
```

## 🔍 故障排除

### 1. 定时任务不执行

**检查项目**:
- Worker是否正确部署
- 定时任务配置是否正确
- 数据库绑定是否正确

**解决方案**:
```bash
# 重新部署Worker
wrangler deploy --config wrangler.card-key-cleanup.json

# 检查定时任务状态
wrangler cron trigger --cron="0 2 * * *" card-key-cleanup-worker
```

### 2. 手动清理失败

**常见原因**:
- 权限不足（需要皇帝角色）
- 数据库连接问题
- 网络超时

**解决方案**:
- 检查用户权限
- 查看服务器日志
- 重试操作

### 3. 卡密状态未重置

**检查项目**:
- 临时账号删除是否成功
- 数据库事务是否完整
- 关联关系是否正确

## 📝 最佳实践

### 1. 定期监控
- 每周检查清理日志
- 监控过期卡密数量
- 关注异常清理情况

### 2. 备份策略
- 清理前自动备份重要数据
- 保留清理日志至少30天
- 定期导出卡密使用统计

### 3. 性能优化
- 大量卡密时分批清理
- 避免在高峰期手动清理
- 监控数据库性能影响

## 🔗 相关文件

- `app/lib/card-keys.ts` - 核心清理逻辑
- `app/api/cleanup/card-keys/route.ts` - 清理API接口
- `workers/card-key-cleanup.ts` - 定时任务Worker
- `app/admin/card-keys/page.tsx` - 管理界面
- `wrangler.card-key-cleanup.example.json` - Worker配置模板
