import { ProfileForm } from "@/components/settings/ProfileForm";
import { requireProfile } from "@/lib/auth";

export default async function ProfileSettingsPage() {
  const profile = await requireProfile();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <ProfileForm
        initial={{
          name: profile.name ?? "",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatarUrl ?? "",
          email: profile.email,
        }}
      />
    </section>
  );
}
