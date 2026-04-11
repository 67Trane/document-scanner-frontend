import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { CONTRACT_TYPE_OPTIONS, CustomerDocument } from "../../../../models/document.model";
import { DocumentService } from "../../../../services/document.service";

@Component({
  selector: "app-customer-contracts-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-contracts-list.html",
  styleUrl: "./customer-contracts-list.css",
})
export class CustomerContractsList {
  private documentService = inject(DocumentService);

  documents = input<CustomerDocument[]>([]);

  selectContract = output<CustomerDocument>();
  deleteContract = output<CustomerDocument>();
  contractTypeChanged = output<CustomerDocument>();

  editingId = signal<number | null>(null);
  readonly contractTypeOptions = CONTRACT_TYPE_OPTIONS;

  onSelect(contract: CustomerDocument) {
    if (this.editingId() === contract.id) return;
    this.selectContract.emit(contract);
  }

  onDelete(event: MouseEvent, contract: CustomerDocument) {
    event.stopPropagation();
    if (confirm(`Dokument wirklich löschen?`)) {
      this.deleteContract.emit(contract);
    }
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
}
