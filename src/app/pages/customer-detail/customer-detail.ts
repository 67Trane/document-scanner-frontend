import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal, effect } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { CustomerService } from "../../services/customer.service";
import { DocumentService } from "../../services/document.service";
import { Customer } from "../../models/customer.model";
import { CustomerDocument } from "../../models/document.model";
import { AppConfig } from "../../config";

import { CustomerHeader } from "./components/customer-header/customer-header";
import { CustomerProfileCard } from "./components/customer-profile-card/customer-profile-card";
import { CustomerContactCard } from "./components/customer-contact-card/customer-contact-card";
import { CustomerContractsList } from "./components/customer-contracts-list/customer-contracts-list";
import { CustomerPdfViewer } from "./components/customer-pdf-viewer/customer-pdf-viewer";
import { CustomerNotesPanel } from "./components/customer-notes-panel/customer-notes-panel";

/* =========================
   Notes Types
   ========================= */
// Note: Comments in English as requested.
type CustomerNote = {
  id: string;
  text: string;
  createdAt: Date;
};

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
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private documentService = inject(DocumentService);
  private customerId = Number(this.route.snapshot.paramMap.get("id"));

  /* =========================
     Core State
     ========================= */
  customer = signal<Customer | null>(null);
  document = signal<CustomerDocument | null>(null);
  alldocuments = signal<CustomerDocument[]>([]);

  /* =========================
     UI Helpers
     ========================= */
  today = new Date();

  /* =========================
     PDF Viewer Source (Blob URL)
     ========================= */
  viewerSrc = signal<string | undefined>(undefined);

  /* =========================
     Computed: Customer Basics
     ========================= */
  fullName = computed(() => {
    const c = this.customer();
    return c ? `${c.first_name} ${c.last_name}` : "";
  });

  email = computed(() => this.customer()?.email?.trim() || null);
  phone = computed(() => this.customer()?.phone?.trim() || null);

  addressLine1 = computed(() => this.customer()?.street || "");
  addressLine2 = computed(() => {
    const c = this.customer();
    return c ? `${c.zip_code} ${c.city}`.trim() : "";
  });

  /* =========================
     Computed: Insights
     ========================= */
  licensePlates = computed(() => {
    const docs = this.alldocuments();
    const allPlates = docs.flatMap((doc) => doc.license_plates ?? []);
    const filtered = allPlates.filter((p) => p && p.trim().length > 0);
    return Array.from(new Set(filtered));
  });

  policyNumbers = computed(() => {
    const docs = this.alldocuments();

    const allNumbers = docs.flatMap((doc) => doc.policy_numbers ?? []);
    const filtered = allNumbers
      .map((n) => (n ?? "").trim())
      .filter((n) => n.length > 0);

    return Array.from(new Set(filtered));
  });


  activeContractsCount = computed(() => {
    return this.alldocuments().filter((doc) => doc.contract_status === "aktiv").length;
  });

  /* =========================
     Notes State
     ========================= */
  notes = signal<CustomerNote[]>([]);
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

  onContactUpdated(): void {
    this.loadCustomer(this.customerId);
    this.loadDocuments(this.customerId);
  }


  /* =========================
     Lifecycle (constructor init)
     ========================= */
  constructor() {
    const customerId = Number(this.route.snapshot.paramMap.get("id"));
    if (!customerId) {
      console.error("Keine gültige ID in der URL gefunden.");
      return;
    }

    // Fetch PDF as a blob so auth cookies are sent; ngx-extended-pdf-viewer
    // can't attach credentials to a plain URL fetch.
    effect((onCleanup) => {
      const doc = this.document();
      const docId = doc?.id;
      if (!docId) {
        this.viewerSrc.set(undefined);
        return;
      }

      let active = true;
      let objectUrl: string | null = null;

      const sub = this.documentService.getDocumentFileBlob(docId).subscribe({
        next: (blob) => {
          if (!active) return;
          objectUrl = URL.createObjectURL(blob);
          this.viewerSrc.set(objectUrl);
        },
        error: (err) => {
          console.error("Fehler beim Laden des Dokuments:", err);
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
      const customer = this.customer();
      if (!customer) return;

      const draft = this.notesDraft().trim();
      if (draft === this.lastSavedNotes) return;

      if (this.notesAutoSaveTimer) clearTimeout(this.notesAutoSaveTimer);
      this.notesAutoSaveTimer = setTimeout(() => {
        this.notesAutoSaveTimer = null;
        this.saveNotes();
      }, 1200);
    });

    this.loadCustomer(customerId);
    this.loadDocuments(customerId);
  }

  /* =========================
     Data Loading
     ========================= */
  private loadCustomer(customerId: number): void {
    this.customerService.getCustomer(customerId).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.notesDraft.set(data.notes ?? "");
        this.lastSavedNotes = (data.notes ?? "").trim();
      },
      error: (err) => console.error("Fehler beim Laden des Kunden:", err),
    });
  }


  private loadDocuments(customerId: number): void {
    this.documentService.getDocumentsByCustomer(customerId).subscribe({
      next: (docs) => {
        this.alldocuments.set(docs);
        this.document.set(docs[0] ?? null);
      },
      error: (err) => console.error("Fehler beim Laden der Dokumente:", err),
    });
  }

  /* =========================
     Contracts
     ========================= */
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

    const a = document.createElement("a");
    a.href = url;
    a.download = "dokument.pdf";
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  /* =========================
     Notes
     ========================= */
  addNote(): void {
    const text = this.notesDraft().trim();
    if (!text) return;

    const next: CustomerNote = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date(),
    };

    // Newest first
    this.notes.set([next, ...this.notes()]);
    this.notesDraft.set("");
  }

  saveNotes(): void {
    const c = this.customer();
    if (!c) return;
    if (this.isSavingNotes()) return;

    const notes = this.notesDraft().trim();
    if (notes === this.lastSavedNotes) return;

    this.isSavingNotes.set(true);
    this.saveNotesError.set(false);

    this.customerService.patchCustomer(c.id, { notes }).subscribe({
      next: (updated) => {
        this.customer.set(updated);
        const synced = (updated.notes ?? "").trim();
        this.notesDraft.set(synced);
        this.lastSavedNotes = synced;
        this.isSavingNotes.set(false);
        this.saveNotesError.set(false);
      },
      error: (err) => {
        console.error("Fehler beim Speichern der Notizen:", err);
        this.isSavingNotes.set(false);
        this.saveNotesError.set(true);
      },
    });
  }


  deleteNote(id: string): void {
    this.notes.set(this.notes().filter((n) => n.id !== id));
  }

  onNoteKeydown(event: KeyboardEvent): void {
    // Enter saves, Shift+Enter creates a new line
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.addNote();
    }
  }

  /* =========================
     Upload (placeholder)
     ========================= */
  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset input so selecting the same file again triggers change
    input.value = "";

    // TODO: Wire to backend upload endpoint via DocumentService
    console.log("Selected file:", file.name, file.type, file.size);
  }
}
