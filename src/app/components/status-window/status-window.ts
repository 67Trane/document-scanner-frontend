import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-window.html',
  styleUrl: './status-window.css',
})
export class StatusWindow implements OnChanges {
 @Input() title = '';
  @Input() description = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible = false;
  @Input() autoClose = true

  // ms (0 = disabled)
  @Input() autoCloseDuration = 0;

  @Output() closed = new EventEmitter<void>();

  private timeoutId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Clear previous timer when visibility/duration changes
    if (changes['visible'] || changes['autoCloseDuration']) {
      this.clearTimer();
    }

    // Start timer only when it becomes visible
    if (this.visible && this.autoCloseDuration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.closed.emit();
      }, this.autoCloseDuration);
    }
  }

  onCloseClick(): void {
    this.clearTimer();
    this.closed.emit();
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}