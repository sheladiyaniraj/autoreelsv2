import { TalkingHeadForm } from "@/components/talking-head-form";

export default function TalkingHeadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Talking-Head Editor</h1>
        <p className="text-muted-foreground">
          Upload your own talking-head footage and get back a polished vertical
          Reel with AI B-roll cutaways and kinetic captions.
        </p>
      </div>
      <TalkingHeadForm />
    </div>
  );
}
