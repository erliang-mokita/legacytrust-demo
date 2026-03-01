export default function PrivacyPage() {
  return (
    <article className="prose max-w-none rounded bg-white p-6">
      <h1>隐私政策（MVP）</h1>
      <p>我们遵循最小化数据原则，仅保存运行所需的账户信息与密文数据。</p>
      <ul>
        <li>敏感正文和文件在客户端加密后上传，服务器不保存明文。</li>
        <li>我们记录关键操作审计日志（创建、更新、触发、撤回、确认）。</li>
        <li>请自行保护主口令，遗失后无法恢复。</li>
      </ul>
    </article>
  );
}
