import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-customer-notes-panel",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-notes-panel.html",
  styleUrl: "./customer-notes-panel.css",
})
export class CustomerNotesPanel {
  notesDraft = input<string>("");
  canSave = input<boolean>(false);
  saveState = input<"saved" | "saving" | "dirty" | "error">("saved");

  notesDraftChange = output<string>();
  save = output<void>();

  /**
   * Emits draft updates to keep save orchestration centralized in the parent container.
   */
  onDraftInput(event: Event): void {
    this.notesDraftChange.emit((event.target as HTMLTextAreaElement).value);
  }

  statusLabel(): string {
    switch (this.saveState()) {
      case "saving":
        return "Speichern...";
      case "dirty":
        return "Änderungen vorhanden";
      case "error":
        return "Fehler beim Speichern";
      default:
        return "Gespeichert";
    }
  }

  statusClass(): string {
    const base = "inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold";
    switch (this.saveState()) {
      case "saving":
        return `${base} bg-amber-500/20 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-400/40 dark:border-amber-400/50`;
      case "dirty":
        return `${base} bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-400/40 dark:border-blue-400/50`;
      case "error":
        return `${base} bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300 border border-red-400/50 dark:border-red-400/60`;
      default:
        return `${base} bg-emerald-600/20 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 dark:border-emerald-400/50`;
    }
  }
}
