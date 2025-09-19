-- 创建临时用户角色（如果不存在）
INSERT OR IGNORE INTO role (id, name, description, created_at, updated_at) 
VALUES ('temp-user-role-id', 'temp_user', '临时用户，只能访问绑定的邮箱', datetime('now'), datetime('now'));

-- 创建测试卡密
INSERT INTO card_keys (id, code, email_address, is_used, expires_at, created_at) 
VALUES (
  'test-card-key-id-' || datetime('now'),
  'XYMAIL-TEST-WCPW-1234',
  'test-' || strftime('%s', 'now') || '@xiyang.app',
  0,
  datetime('now', '+7 days'),
  datetime('now')
);

-- 查看创建的卡密
SELECT code, email_address, expires_at FROM card_keys WHERE code LIKE 'XYMAIL-TEST%' ORDER BY created_at DESC LIMIT 1;
