import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { CustomerDocument } from "../../../../models/document.model";

@Component({
  selector: "app-customer-contracts-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./customer-contracts-list.html",
  styleUrl: "./customer-contracts-list.css",
})
export class CustomerContractsList {
  documents = input<CustomerDocument[]>([]);

  // Emits when a contract row is clicked (preview/selection)
  selectContract = output<CustomerDocument>();

  onSelect(contract: CustomerDocument) {
    this.selectContract.emit(contract);
  }
}
