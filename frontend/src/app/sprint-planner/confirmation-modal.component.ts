// confirmation-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Confirm Action</h3>
        <p>Are you sure you want to delete <strong>{{ itemName }}</strong>?</p>
        <p class="warning-text">⚠️ This action is irreversible.</p>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="onCancel()">Cancel</button>
          <button class="btn-confirm" (click)="onConfirm()">Confirm</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    }
    .modal-content {
      background: white; padding: 20px; border-radius: 8px;
      max-width: 400px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .warning-text { color: #d9534f; font-size: 0.9em; margin-top: 5px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-cancel { background: #ccc; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-confirm { background: #d9534f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
  `]
})
export class ConfirmationModalComponent {
  @Input() itemName: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() { this.confirm.emit(); }
  onCancel() { this.cancel.emit(); }
}
