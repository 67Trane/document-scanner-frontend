import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output, signal } from "@angular/core";
import { CustomerDocument } from "../../../../models/document.model";
import { DocumentService } from "../../../../services/document.service";
import { CategoryService } from "../../../../services/category.service";
import { ContractTypeService } from "../../../../services/contract-type.service";
import { TaxonomyManagementModal } from "../taxonomy-management-modal/taxonomy-management-modal";

type TaxonomyKind = "category" | "contractType";

@Component({
  selector: "app-customer-contracts-list",
  standalone: true,
  imports: [CommonModule, TaxonomyManagementModal],
  templateUrl: "./customer-contracts-list.html",
  styleUrl: "./customer-contracts-list.css",
})
export class CustomerContractsList {
  private documentService = inject(DocumentService);
  readonly categoryService = inject(CategoryService);
  readonly contractTypeService = inject(ContractTypeService);

  documents = input<CustomerDocument[]>([]);

  selectContract = output<CustomerDocument>();
  deleteContract = output<CustomerDocument>();
  contractTypeChanged = output<CustomerDocument>();

  editingId = signal<number | null>(null);
  editingCategoryId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  /**
   * Which taxonomy management modal (if any) is currently open.
   * One modal slot, two possible adapters — the active value picks the labels.
   */
  managerOpen = signal<TaxonomyKind | null>(null);

  /** Live "Sonstige" + dynamic options from the API. */
  readonly categoryOptions = computed(() => [
    { value: "", label: "Sonstige" },
    ...this.categoryService.items().map(c => ({ value: c.slug, label: c.label })),
  ]);

  readonly contractTypeOptions = computed(() => [
    { value: "", label: "Sonstige" },
    ...this.contractTypeService.items().map(c => ({ value: c.slug, label: c.label })),
  ]);

  constructor() {
    this.categoryService.load();
    this.contractTypeService.load();
  }

  // -------------------------
  // Taxonomy management modals
  // -------------------------

  openCategoryManager(event: MouseEvent): void {
    event.stopPropagation();
    this.managerOpen.set("category");
  }

  openContractTypeManager(event: MouseEvent): void {
    event.stopPropagation();
    this.managerOpen.set("contractType");
  }

  closeManager(): void {
    this.managerOpen.set(null);
  }

  // -------------------------
  // Row actions
  // -------------------------

  onSelect(contract: CustomerDocument) {
    if (this.editingId() === contract.id) return;
    if (this.deletingId() === contract.id) return;
    this.selectContract.emit(contract);
  }

  onDelete(event: MouseEvent, contract: CustomerDocument) {
    event.stopPropagation();
    this.deletingId.set(contract.id);
  }

  onDeleteConfirm(event: MouseEvent, contract: CustomerDocument) {
    event.stopPropagation();
    this.deletingId.set(null);
    this.deleteContract.emit(contract);
  }

  onDeleteCancel(event: MouseEvent) {
    event.stopPropagation();
    this.deletingId.set(null);
  }

  onEditType(event: MouseEvent, contract: CustomerDocument) {
    event.stopPropagation();
    this.editingId.set(contract.id);
  }

  onTypeChange(event: Event, contract: CustomerDocument) {
    event.stopPropagation();
    const newType = (event.target as HTMLSelectElement).value;
    this.documentService.patchDocument(contract.id, { contract_typ: newType as any }).subscribe({
      next: (updated) => {
        this.contractTypeChanged.emit(updated);
        this.editingId.set(null);
      },
      error: () => {
        this.editingId.set(null);
      },
    });
  }

  onEditCancel(event: MouseEvent) {
    event.stopPropagation();
    this.editingId.set(null);
  }

  onEditCategory(event: MouseEvent, contract: CustomerDocument) {
    event.stopPropagation();
    this.editingCategoryId.set(contract.id);
  }

  onCategoryChange(event: Event, contract: CustomerDocument) {
    event.stopPropagation();
    const newCategory = (event.target as HTMLSelectElement).value || null;
    this.documentService.patchDocument(contract.id, { document_category: newCategory as any }).subscribe({
      next: (updated) => {
        this.contractTypeChanged.emit(updated);
        this.editingCategoryId.set(null);
      },
      error: () => {
        this.editingCategoryId.set(null);
      },
    });
  }

  onEditCategoryCancel(event: MouseEvent) {
    event.stopPropagation();
    this.editingCategoryId.set(null);
  }
}
