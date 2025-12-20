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

  notesDraftChange = output<string>();
  save = output<void>();

  onDraftInput(value: string) {
    this.notesDraftChange.emit(value);
  }
}
