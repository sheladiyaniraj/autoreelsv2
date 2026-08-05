import { createClient } from "@/lib/supabase/server";
import { BulkCreateForm } from "@/components/bulk-create-form";

export default async function BulkCreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: voices }, { data: templates }, { data: profile }] = await Promise.all([
    supabase
      .from("voices")
      .select("id, name, lang, gender, provider")
      .order("name"),
    supabase
      .from("templates")
      .select("id, name, caption_style_json, music_id")
      .order("name"),
    supabase.from("users").select("credits").eq("id", user!.id).single(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Bulk generate</h1>
        <p className="text-muted-foreground">
          Pick shared settings once, then paste a list of topics: one reel
          per line, each using 1 credit.
        </p>
      </div>
      <BulkCreateForm
        voices={voices ?? []}
        templates={templates ?? []}
        credits={profile?.credits ?? 0}
      />
    </div>
  );
}
