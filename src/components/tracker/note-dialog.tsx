import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { NOTE_MAX } from "@/lib/persist-state";

export function NoteDialog({
  open,
  habitName,
  date,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  habitName: string;
  date: string;
  initial: string;
  onOpenChange: (open: boolean) => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);

  useEffect(() => {
    if (open) setText(initial);
  }, [open, initial]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(text.trim());
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Note for ${habitName}`}
      description={`How it went on ${date}. Leave it empty to remove the note.`}
    >
      <form onSubmit={submit}>
        <label htmlFor="checkin-note" className="mb-2 block text-sm font-medium">
          Note
        </label>
        <textarea
          id="checkin-note"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, NOTE_MAX))}
          maxLength={NOTE_MAX}
          rows={4}
          placeholder="Went longer than planned"
          className="w-full resize-none rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:ring-2 focus-visible:outline-none"
          autoFocus
        />
        <p className="mt-1 text-right text-xs text-muted tabular-nums">
          {text.length}/{NOTE_MAX}
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Save note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
