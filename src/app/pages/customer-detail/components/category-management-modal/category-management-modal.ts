import { CommonModule } from "@angular/common";
import { Component, computed, inject, output, signal } from "@angular/core";

import { CategoryService } from "../../../../services/category.service";
import { DocumentCategoryItem } from "../../../../models/document.model";

/**
 * Management UI for the broker's document category taxonomy.
 *
 * Categories are loaded from CategoryService and displayed grouped by
 * parent → child. The user can create new top-level categories and
 * subcategories, rename, and delete existing ones. Deleting cascades to
 * subcategories on the backend; documents using a deleted category fall
 * back to "Sonstige" (null) via the FK's on_delete=SET_NULL.
 */
@Component({
  selector: "app-category-management-modal",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./category-management-modal.html",
  styleUrl: "./category-management-modal.css",
})
export class CategoryManagementModal {
  private readonly categoryService = inject(CategoryService);

  close = output<void>();

  // Live view of all categories.
  readonly categories = this.categoryService.categories;
  readonly topLevel = computed(() =>
    this.categories().filter(c => c.parent === null),
  );

  // --- Inline edit state ---
  editingId = signal<number | null>(null);
  editLabel = signal<string>("");

  // --- Delete confirmation state ---
  deletingId = signal<number | null>(null);

  // --- New top-level category state ---
  newCategoryName = signal<string>("");

  // --- New subcategory state ---
  addingSubcategoryFor = signal<number | null>(null);
  newSubcategoryName = signal<string>("");

  // --- Generic feedback ---
  errorMsg = signal<string>("");
  isSaving = signal(false);

  childrenOf(parentId: number): DocumentCategoryItem[] {
    return this.categories().filter(c => c.parent === parentId);
  }

  // -------------------------
  // Add new top-level
  // -------------------------

  onNewCategoryInput(e: Event): void {
    this.newCategoryName.set((e.target as HTMLInputElement).value);
  }

  addCategory(): void {
    const label = this.newCategoryName().trim();
    if (!label) return;
    this.runAction(this.categoryService.create(label, null), () => {
      this.newCategoryName.set("");
    });
  }

  onNewCategoryKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this.addCategory();
    }
  }

  // -------------------------
  // Add subcategory
  // -------------------------

  startAddSubcategory(parentId: number): void {
    this.addingSubcategoryFor.set(parentId);
    this.newSubcategoryName.set("");
  }

  cancelAddSubcategory(): void {
    this.addingSubcategoryFor.set(null);
    this.newSubcategoryName.set("");
  }

  onNewSubcategoryInput(e: Event): void {
    this.newSubcategoryName.set((e.target as HTMLInputElement).value);
  }

  addSubcategory(parentId: number): void {
    const label = this.newSubcategoryName().trim();
    if (!label) return;
    this.runAction(this.categoryService.create(label, parentId), () => {
      this.cancelAddSubcategory();
    });
  }

  onNewSubcategoryKeydown(e: KeyboardEvent, parentId: number): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this.addSubcategory(parentId);
    } else if (e.key === "Escape") {
      this.cancelAddSubcategory();
    }
  }

  // -------------------------
  // Rename
  // -------------------------

  startEdit(category: DocumentCategoryItem): void {
    this.editingId.set(category.id);
    this.editLabel.set(category.label);
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
    this.runAction(this.categoryService.update(id, { label }), () => {
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
    this.runAction(this.categoryService.delete(id), () => {
      this.deletingId.set(null);
    });
  }

  // -------------------------
  // Internals
  // -------------------------

  /**
   * Wrapper to keep error / saving state DRY across all mutations.
   * onSuccess fires after the network call resolves.
   */
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
