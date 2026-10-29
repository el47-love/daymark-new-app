import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PeriodNav({
  label,
  detail,
  onPrev,
  onNext,
  canNext,
  prevLabel,
  nextLabel,
  showJump,
  jumpLabel,
  onJump,
}: {
  label: string;
  detail: string;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
  prevLabel: string;
  nextLabel: string;
  showJump: boolean;
  jumpLabel: string;
  onJump: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" aria-label={prevLabel} onClick={onPrev}>
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate font-display text-xl font-medium tracking-tight">{label}</p>
          <p className="text-sm text-muted tabular-nums">{detail}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label={nextLabel} onClick={onNext} disabled={!canNext}>
          <ChevronRight className="size-5" />
        </Button>
      </div>
      {showJump ? (
        <div className="mt-1 text-center">
          <Button variant="ghost" onClick={onJump}>
            {jumpLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
