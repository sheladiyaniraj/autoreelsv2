"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewPopup({
  reelId,
  open,
  onDone,
}: {
  reelId: string;
  open: boolean;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch(`/api/reels/${reelId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
    } finally {
      setSubmitting(false);
      onDone();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDone();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was your reel?</DialogTitle>
          <DialogDescription>
            Your feedback helps us make AutoReels better.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  star <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <Textarea
            placeholder="Anything you'd like to add? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDone} disabled={submitting}>
            Maybe later
          </Button>
          <Button onClick={submit} disabled={rating === 0 || submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
