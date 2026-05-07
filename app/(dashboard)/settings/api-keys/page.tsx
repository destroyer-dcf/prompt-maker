import { listApiKeys } from "@/actions/api-keys";
import { ApiKeyCreateForm } from "@/components/settings/ApiKeyCreateForm";
import { ApiKeyList } from "@/components/settings/ApiKeyList";

export default async function ApiKeysPage() {
  const keys = await listApiKeys();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <ApiKeyCreateForm />
      <ApiKeyList keys={keys} />
    </section>
  );
}
