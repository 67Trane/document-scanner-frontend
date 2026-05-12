import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";

import { TaxonomyAdapter, TaxonomyItem } from "../../../../models/taxonomy.model";

/**
 * Generic management UI for any per-broker taxonomy (document categories,
 * contract types, …). The host page passes in an adapter — both
 * CategoryService and ContractTypeService expose the required shape via
 * duck typing — plus the German labels to use throughout the dialog.
 *
 * Items are displayed as a flat list. The user can create, rename, and
 * delete entries. Documents using a deleted entry fall back to "Sonstige"
 * via the backend's on_delete=SET_NULL.
 */
@Component({
  selector: "app-taxonomy-management-modal",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./taxonomy-management-modal.html",
  styleUrl: "./taxonomy-management-modal.css",
})
export class TaxonomyManagementModal {
  /** Service that provides the live items + create/update/delete behaviour. */
  adapter = input.required<TaxonomyAdapter>();

  /** Header text — e.g. "Kategorien verwalten" or "Versicherungsarten verwalten". */
  title = input<string>("Verwalten");

  /** Short explanation under the title. */
  subtitle = input<string>("");

  /** Singular label used in body copy — e.g. "Kategorie" or "Vertragsart". */
  itemLabel = input<string>("Eintrag");

  /** Plural form used in headers and placeholders. */
  itemLabelPlural = input<string>("Einträge");

  close = output<void>();

  readonly items = computed(() => this.adapter().items());

  // --- Inline edit state ---
  editingId = signal<number | null>(null);
  editLabel = signal<string>("");

  // --- Delete confirmation state ---
  deletingId = signal<number | null>(null);

  // --- New entry state ---
  newItemName = signal<string>("");

  // --- Generic feedback ---
  errorMsg = signal<string>("");
  isSaving = signal(false);

  // -------------------------
  // Add new entry
  // -------------------------

  onNewItemInput(e: Event): void {
    this.newItemName.set((e.target as HTMLInputElement).value);
  }

  addItem(): void {
    const label = this.newItemName().trim();
    if (!label) return;
    this.runAction(this.adapter().create(label), () => {
      this.newItemName.set("");
    });
  }

  onNewItemKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this.addItem();
    }
  }

  // -------------------------
  // Rename
  // -------------------------

  startEdit(item: TaxonomyItem): void {
    this.editingId.set(item.id);
    this.editLabel.set(item.label);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editLabel.set("");
  }

  onEditLabelInput(e: Event): void {
    this.editLabel.set((e.target as HTMLInputElement).value);
  }

  commitEdit(): void {
    const id = this.editingId();
    const label = this.editLabel().trim();
    if (id === null || !label) return;
    this.runAction(this.adapter().update(id, { label }), () => {
      this.cancelEdit();
    });
  }

  onEditKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this.commitEdit();
    } else if (e.key === "Escape") {
      this.cancelEdit();
    }
  }

  // -------------------------
  // Delete
  // -------------------------

  confirmDelete(id: number): void {
    this.deletingId.set(id);
  }

  cancelDelete(): void {
    this.deletingId.set(null);
  }

  commitDelete(): void {
    const id = this.deletingId();
    if (id === null) return;
    this.runAction(this.adapter().delete(id), () => {
      this.deletingId.set(null);
    });
  }

  // -------------------------
  // Internals
  // -------------------------

  /** Keeps error / saving state DRY across all mutations. */
  private runAction(observable: { subscribe: Function }, onSuccess: () => void): void {
    this.isSaving.set(true);
    this.errorMsg.set("");
    (observable as any).subscribe({
      next: () => {
        this.isSaving.set(false);
        onSuccess();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMsg.set("Aktion fehlgeschlagen. Bitte erneut versuchen.");
      },
    });
  }
}
