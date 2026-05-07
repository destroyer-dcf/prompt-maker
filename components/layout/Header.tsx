import { CommandPalette } from "@/components/layout/CommandPalette";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { PromptSearchBar } from "@/components/layout/PromptSearchBar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import type { NotificationFeedItem } from "@/lib/db/queries/notifications";

type HeaderProps = {
  userName: string;
  role: "admin" | "user";
  commandPrompts: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    targetModels: string[];
    templateDefaults?: Record<string, string>;
  }>;
  notifications: NotificationFeedItem[];
  unreadNotificationCount: number;
  collections: Array<{ id: string; name: string; promptCount: number }>;
};

export function Header({
  userName,
  role,
  commandPrompts,
  notifications,
  unreadNotificationCount,
  collections,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-[--surface]/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MobileSidebar collections={collections} />
          <PromptSearchBar />
        </div>

        <div className="flex items-center gap-3">
          <CommandPalette prompts={commandPrompts} />
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadNotificationCount}
          />
          <ThemeToggle />
          <UserMenu name={userName} role={role} />
        </div>
      </div>
    </header>
  );
}
