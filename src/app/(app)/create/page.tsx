import Link from "next/link";
import { Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateWizard } from "@/components/create-wizard";
import { Button } from "@/components/ui/button";

export default async function CreatePage() {
  const supabase = await createClient();

  const [{ data: voices }, { data: templates }] = await Promise.all([
    supabase
      .from("voices")
      .select("id, name, lang, gender, provider, sample_url")
      .order("name"),
    supabase
      .from("templates")
      .select("id, name, caption_style_json, music_id")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Create a reel</h1>
          <p className="text-muted-foreground">
            Go from a topic to a finished faceless reel in 8 quick steps.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/create/bulk" />}>
          <Layers className="size-4" />
          Bulk generate
        </Button>
      </div>
      <CreateWizard voices={voices ?? []} templates={templates ?? []} />
    </div>
  );
}
