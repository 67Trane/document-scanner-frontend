import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NoteService } from '../../../../services/note.service';
import { CustomerNote, NoteCategory, NOTE_CATEGORY_OPTIONS } from '../../../../models/customer.model';

@Component({
  selector: 'app-customer-notes-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-notes-panel.html',
  styleUrl: './customer-notes-panel.css',
})
export class CustomerNotesPanel implements OnInit {
  private readonly noteService = inject(NoteService);
  private readonly customerId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly categoryOptions = NOTE_CATEGORY_OPTIONS;

  notes = signal<CustomerNote[]>([]);
  doneCount = computed(() => this.notes().filter(n => n.is_done).length);
  isLoading = signal(false);

  // Add-form state
  showForm = signal(false);
  formTitle = signal('');
  formText = signal('');
  formCategory = signal<NoteCategory>('allgemein');
  isSaving = signal(false);
  formError = signal('');

  // Pending delete
  deletingId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.noteService.getNotes(this.customerId).subscribe({
      next: (res) => { this.notes.set(res.results); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  openForm(): void {
    this.formTitle.set('');
    this.formText.set('');
    this.formCategory.set('allgemein');
    this.formError.set('');
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  submitForm(): void {
    const title = this.formTitle().trim();
    if (!title) { this.formError.set('Titel ist erforderlich.'); return; }
    this.isSaving.set(true);
    this.formError.set('');
    this.noteService.createNote(this.customerId, {
      title,
      text: this.formText().trim(),
      category: this.formCategory(),
    }).subscribe({
      next: (note) => {
        this.notes.update(list => [note, ...list]);
        this.isSaving.set(false);
        this.showForm.set(false);
      },
      error: () => { this.isSaving.set(false); this.formError.set('Speichern fehlgeschlagen.'); },
    });
  }

  toggleDone(note: CustomerNote): void {
    this.noteService.patchNote(note.id, { is_done: !note.is_done }).subscribe({
      next: (updated) => this.notes.update(list =>
        list.map(n => n.id === updated.id ? updated : n)
            .sort((a, b) => Number(a.is_done) - Number(b.is_done))
      ),
    });
  }

  confirmDelete(id: number): void { this.deletingId.set(id); }
  cancelDelete(): void { this.deletingId.set(null); }

  deleteNote(id: number): void {
    this.noteService.deleteNote(id).subscribe({
      next: () => { this.notes.update(list => list.filter(n => n.id !== id)); this.deletingId.set(null); },
    });
  }

  onTitleInput(e: Event): void { this.formTitle.set((e.target as HTMLInputElement).value); }
  onTextInput(e: Event): void { this.formText.set((e.target as HTMLTextAreaElement).value); }
  onCategoryChange(e: Event): void { this.formCategory.set((e.target as HTMLSelectElement).value as NoteCategory); }
}
