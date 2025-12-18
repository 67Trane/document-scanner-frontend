import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";
import { CustomerDocument } from "../../../../models/document.model";

@Component({
  selector: "app-customer-pdf-viewer",
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: "./customer-pdf-viewer.html",
  styleUrl: "./customer-pdf-viewer.css",

})
export class CustomerPdfViewer {
  // Viewer source (use undefined when empty; ngx viewer doesn't accept null)
  src = input<string | undefined>(undefined);

  // Selected document (used for labels / buttons)
  document = input<CustomerDocument | null>(null);

  // Actions
  download = output<void>();
  openOriginal = output<void>();
}
