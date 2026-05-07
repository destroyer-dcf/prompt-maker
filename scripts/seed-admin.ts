import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = line.slice(separator + 1).replace(/^"|"$/g, "");
  }
}

async function seedAdmin() {
  loadDotenvLocal();
  const [{ getDb }, { profiles }, { assertEnv }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
    import("@/lib/env"),
  ]);
  const db = getDb();

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.role, "admin"),
  });

  if (existing) {
    console.log(`Ya existe un admin: ${existing.email}`);
    process.exit(0);
  }

  const email = assertEnv("ADMIN_EMAIL", process.env.ADMIN_EMAIL ?? "");
  const password = assertEnv("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD ?? "");
  const name = assertEnv("ADMIN_NAME", process.env.ADMIN_NAME ?? "");
  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const serviceRoleKey = assertEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  );

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: "admin" },
  });

  let userId = data.user?.id;

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        throw listError;
      }

      const existingUser = listed.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
      if (!existingUser?.id) {
        throw new Error("No se encontró el usuario admin existente en Auth.");
      }

      userId = existingUser.id;
    } else {
      throw error;
    }
  }

  if (!userId) {
    throw new Error("No se pudo resolver el id del usuario admin.");
  }

  await db
    .insert(profiles)
    .values({
      id: userId,
      email,
      name,
      role: "admin",
      status: "active",
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        name,
        role: "admin",
        status: "active",
        updatedAt: new Date(),
      },
    });

  console.log(`Admin listo: ${email}`);
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
