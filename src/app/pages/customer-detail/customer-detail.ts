import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";

import { CustomerService } from "../../services/customer.service";
import { DocumentService } from "../../services/document.service";
import { Customer } from "../../models/customer.model";
import { CustomerDocument } from "../../models/document.model";
import { AppConfig } from "../../runtime-config";

import { CustomerHeader } from "./components/customer-header/customer-header";
import { CustomerProfileCard } from "./components/customer-profile-card/customer-profile-card";
import { CustomerContactCard } from "./components/customer-contact-card/customer-contact-card";
import { CustomerContractsList } from "./components/customer-contracts-list/customer-contracts-list";
import { CustomerPdfViewer } from "./components/customer-pdf-viewer/customer-pdf-viewer";
import { CustomerNotesPanel } from "./components/customer-notes-panel/customer-notes-panel";

@Component({
  selector: "app-customer-detail",
  standalone: true,
  imports: [
    CommonModule,
    CustomerHeader,
    CustomerProfileCard,
    CustomerContactCard,
    CustomerContractsList,
    CustomerPdfViewer,
    CustomerNotesPanel,
  ],
  templateUrl: "./customer-detail.html",
  styleUrl: "./customer-detail.css",
})
export class CustomerDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);
  private readonly documentService = inject(DocumentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly customerId = Number(this.route.snapshot.paramMap.get("id"));

  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null);
  alldocuments = signal<CustomerDocument[]>([]);

  viewerSrc = signal<string | undefined>(undefined);

  fullName = computed(() => {
    const c = this.customer();
    return c ? `${c.first_name} ${c.last_name}` : "";
  });

  email = computed(() => this.customer()?.email?.trim() || null);
  phone = computed(() => this.customer()?.phone?.trim() || null);
  dateOfBirth = computed(() => this.customer()?.date_of_birth ?? null);

  addressLine1 = computed(() => this.customer()?.street || "");
  addressLine2 = computed(() => {
    const c = this.customer();
    return c ? `${c.zip_code} ${c.city}`.trim() : "";
  });

  licensePlates = computed(() => {
    const docs = this.alldocuments();
    const allPlates = docs.flatMap((doc) => doc.license_plates ?? []);
    const filtered = allPlates.filter((plate) => plate && plate.trim().length > 0);
    return Array.from(new Set(filtered));
  });

  policyNumbers = computed(() => {
    const docs = this.alldocuments();
    const allNumbers = docs.flatMap((doc) => doc.policy_numbers ?? []);
    const filtered = allNumbers
      .map((num) => (num ?? "").trim())
      .filter((num) => num.length > 0);

    return Array.from(new Set(filtered));
  });

  notesDraft = signal("");
  private notesAutoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSavedNotes = "";
  private isSavingNotes = signal(false);
  private saveNotesError = signal(false);

  notesSaveState = computed<"saved" | "saving" | "dirty" | "error">(() => {
    const draft = this.notesDraft().trim();

    if (this.isSavingNotes()) return "saving";
    if (this.saveNotesError()) return "error";
    if (draft === this.lastSavedNotes) return "saved";
    return draft.length > 0 ? "dirty" : "saved";
  });

  canSaveNotes = computed(() => {
    const current = (this.customer()?.notes ?? "").trim();
    const draft = this.notesDraft().trim();
    return draft.length > 0 && draft !== current;
  });

  constructor() {
    if (!this.customerId) return;

    // Blob URLs keep authenticated PDF loading reliable in the embedded viewer.
    effect((onCleanup) => {
      const selectedDocument = this.document();
      const docId = selectedDocument?.id;
      if (!docId) {
        this.viewerSrc.set(undefined);
        return;
      }

      let active = true;
      let objectUrl: string | null = null;

      const sub = this.documentService.getDocumentFileBlob(docId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob) => {
          if (!active) return;
          objectUrl = URL.createObjectURL(blob);
          this.viewerSrc.set(objectUrl);
        },
        error: () => {
          this.viewerSrc.set(undefined);
        },
      });

      onCleanup(() => {
        active = false;
        sub.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });

    effect(() => {
      const currentCustomer = this.customer();
      if (!currentCustomer) return;

      const draft = this.notesDraft().trim();
      if (draft === this.lastSavedNotes) return;

      if (this.notesAutoSaveTimer) clearTimeout(this.notesAutoSaveTimer);
      this.notesAutoSaveTimer = setTimeout(() => {
        this.notesAutoSaveTimer = null;
        this.saveNotes();
      }, 1200);
    });

    this.loadCustomer(this.customerId);
    this.loadDocuments(this.customerId);
  }

  /**
   * Reloads data after child components persist contact changes.
   */
  onContactUpdated(): void {
    this.loadCustomer(this.customerId);
    this.loadDocuments(this.customerId);
  }

  private loadCustomer(customerId: number): void {
    this.customerService.getCustomer(customerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.notesDraft.set(data.notes ?? "");
        this.lastSavedNotes = (data.notes ?? "").trim();
      },
      error: () => {
        this.customer.set(null);
      },
    });
  }

  private loadDocuments(customerId: number): void {
    this.documentService.getDocumentsByCustomer(customerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docs) => {
        this.alldocuments.set(docs);
        this.document.set(docs[0] ?? null);
      },
      error: () => {
        this.alldocuments.set([]);
        this.document.set(null);
      },
    });
  }

  openContractPreview(contract: CustomerDocument): void {
    this.document.set(contract);
  }

  openContract(contract: CustomerDocument): void {
    const url = contract.file_url;
    if (!url) return;

    const absolute = url.startsWith("/") ? new URL(url, AppConfig.apiBaseUrl).toString() : url;
    window.open(absolute, "_blank", "noopener");
  }

  downloadCurrentPdf(): void {
    const url = this.viewerSrc();
    if (!url) return;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dokument.pdf";
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.click();
  }

  /**
   * Uses PATCH to keep note updates small and avoid overwriting unrelated customer fields.
   */
  saveNotes(): void {
    const currentCustomer = this.customer();
    if (!currentCustomer) return;
    if (this.isSavingNotes()) return;

    const notes = this.notesDraft().trim();
    if (notes === this.lastSavedNotes) return;

    this.isSavingNotes.set(true);
    this.saveNotesError.set(false);

    this.customerService.patchCustomer(currentCustomer.id, { notes }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.customer.set(updated);
        const synced = (updated.notes ?? "").trim();
        this.notesDraft.set(synced);
        this.lastSavedNotes = synced;
        this.isSavingNotes.set(false);
        this.saveNotesError.set(false);
      },
      error: () => {
        this.isSavingNotes.set(false);
        this.saveNotesError.set(true);
      },
    });
  }
}
