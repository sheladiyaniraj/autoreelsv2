"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Apple-style scroll reveal: fades/lifts an element into place the first
// time it enters the viewport. Plain opacity/transform + IntersectionObserver
// rather than the animate-in keyframe utilities — per-instance delay and
// "only ever plays once" are both simpler to control as transition state
// than as one-shot keyframe animations.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "translate-y-8 opacity-0 transition-all duration-700 ease-out",
        visible && "translate-y-0 opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}
