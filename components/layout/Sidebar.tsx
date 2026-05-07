import { Logo } from "@/components/layout/Logo";
import { SidebarNav } from "@/components/layout/SidebarNav";

export function Sidebar({
  collections = [],
}: {
  collections?: Array<{ id: string; name: string; promptCount: number }>;
}) {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-[--panel] p-5 lg:flex">
      <Logo />
      <SidebarNav collections={collections} />
    </aside>
  );
}
