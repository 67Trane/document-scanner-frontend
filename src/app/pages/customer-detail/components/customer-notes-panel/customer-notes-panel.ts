import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";

export interface CustomerNote {
  id: string;
  text: string;
  createdAt: Date | string;
}


@Component({
  selector: "app-customer-notes-panel",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-notes-panel.html",
  styleUrl: "./customer-notes-panel.css",

})
export class CustomerNotesPanel {
  // Data
  notes = input<CustomerNote[]>([]);
  noteDraft = input<string>("");

  // Actions
  noteDraftChange = output<string>();
  add = output<void>();
  delete = output<string>();

  // UI helper
  canSave = input<boolean>(false);

  onDraftInput(value: string) {
    this.noteDraftChange.emit(value);
  }

  onDelete(id: string) {
    this.delete.emit(id);
  }
}
