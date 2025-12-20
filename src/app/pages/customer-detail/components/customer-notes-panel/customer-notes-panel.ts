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

  onDraftInput(value: string) {
    this.notesDraftChange.emit(value);
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
        return `${base} bg-amber-500/20 text-amber-200 border border-amber-400/40`;
      case "dirty":
        return `${base} bg-blue-500/15 text-blue-200 border border-blue-400/40`;
      case "error":
        return `${base} bg-red-500/20 text-red-200 border border-red-400/50`;
      default:
        return `${base} bg-emerald-600/20 text-emerald-200 border border-emerald-400/40`;
    }
  }
}
