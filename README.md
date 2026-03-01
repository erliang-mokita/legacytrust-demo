# LegacyTrust MVP

LegacyTrust 是一个移动端优先的数字遗嘱/数字遗产托管 Web App MVP，采用类信托角色模型（Settlor / Executor / Beneficiary）。

## 功能概览

- 账户系统：Credentials 注册/登录（NextAuth）
- 托管计划：创建、查看、归档（状态机：SAFE / PENDING_DELIVERY / DELIVERED / REVOKED / ARCHIVED）
- 分步创建计划：基本信息、内容模块、受益人、执行人、触发条件
- 客户端加密：WebCrypto AES-GCM + PBKDF2 派生密钥，服务端仅存密文
- 文件加密上传：本地 `/uploads`（可替换 S3/R2）
- 触发机制（演示）：
  - 不活跃触发（X 天未登录）
  - 执行人 2-of-3 确认触发
  - 设立人手动一键交付/撤回
- 合规页面：免责声明 + 隐私政策
- 审计日志：创建、触发、撤回、确认等

## 技术栈

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + SQLite（默认本地）
- NextAuth (Credentials)

## 快速开始

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

访问：`http://localhost:3000`

## 环境变量

见 `.env.example`：

- `DATABASE_URL`：默认 `file:./dev.db`（SQLite）
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 生产部署

```bash
npm run build
npm run start
```

### 切换 Postgres

1. 修改 `prisma/schema.prisma` 的 datasource provider 为 `postgresql`。
2. 设置 `DATABASE_URL=postgresql://...`。
3. 执行：
   ```bash
   npx prisma migrate dev --name init_pg
   npx prisma generate
   ```

## 加密说明（E2EE 演示级）

- 主口令在浏览器端通过 PBKDF2（150,000 iterations, SHA-256）派生 AES-GCM 256 密钥。
- 文本与文件先在浏览器加密，再上传密文。
- 服务端仅保存密文、IV、salt 与元数据，不保存明文主口令。
- 主口令遗失后无法恢复内容。

## 文件存储

- MVP 使用本地 `uploads/` 保存加密文件。
- 运行时 API 会自动创建目录。
- 可替换成 S3 / Cloudflare R2（TODO）。

## 已知限制

- 执行人确认目前通过邮箱匹配 + 手动确认（未接入真实邮件验证流程）。
- 受益人解密查看流程为演示模式，未实现完整密钥托管与恢复协议。
- Shamir Secret Sharing 为 UI 演示占位（“已生成份额”提示）。
- rate limit 为进程内内存实现，适合开发演示。
- 未做多租户隔离与企业级审计导出。

## 合规边界

- 本产品不是法律遗嘱服务，不保证法律效力。
- 严禁用于隐匿资产、规避监管及任何违法用途。
- 建议用户咨询法律、税务与合规专业人士。

## 可配置项

- 计划默认触发天数（60）
- 执行人阈值（2-of-3）
- cause 分类列表
- rate limit 阈值
- 加密迭代次数

## 5 条下一步快速迭代建议

1. 接入真实邮件/短信通知（SendGrid/SES）并做 executor 身份验证。
2. 文件存储迁移到 R2/S3，并增加对象级访问策略与短期签名 URL。
3. 接入 KMS/HSM 管理服务端密钥封装（Envelope Encryption + key rotation）。
4. 完善合规流程：司法辖区模板、证据链、审计导出、隐私条款版本化。
5. 实现真正密钥拆分与恢复（Shamir shares 分发给执行人 + 多方恢复 UI/API）。

## TODO

- Email Magic Link 登录（可替代 credentials）
- 受益人端站内解密阅读器完整化
