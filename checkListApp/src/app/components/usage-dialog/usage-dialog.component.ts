import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
// Runtime dialog data shape varies (item may be a DisplayItem or runtime shape).
// Use `any` for injected data to avoid coupling to the `Item` model here.
import { ReplaceDialogComponent } from '../replace-dialog/replace-dialog.component';
import { generateInstances } from '../../utils/instance-utils';
import { InstanceDetailDialogComponent } from '../instance-detail-dialog/instance-detail-dialog.component';
import { parseAnyDate, formatDDMMYYYY, isBeforeToday, validateEditableDates } from '../../utils/date-utils';
import { GlobalSnackbarService } from '../../shared/global-snackbar.service';

@Component({
  selector: 'app-usage-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatCheckboxModule, MatIconModule, MatTooltipModule, MatDatepickerModule, MatNativeDateModule, FormsModule],
  template: `
    <div class="ud-header">
      <h2 mat-dialog-title class="ud-title">Required Item(s): {{ data.item.controlQuantity }}</h2>
      <button mat-icon-button aria-label="Close dialog" class="ud-close-btn" (click)="close()"><mat-icon>close</mat-icon></button>
    </div>
    <div class="ud-help-box" role="region" aria-label="Usage instructions">
      <div class="ud-help-header" role="button" tabindex="0" (click)="toggleHelp()" (keydown.enter)="toggleHelp()" (keydown.space)="$event.preventDefault(); toggleHelp()" [attr.aria-expanded]="showHelp">
        <mat-icon class="ud-tip-icon" matTooltip="Quick tips">help_outline</mat-icon>
        <div style="font-weight:700;">How to use</div>
        <mat-icon class="ud-help-chevron" [class.open]="showHelp">expand_more</mat-icon>
      </div>
      <div *ngIf="showHelp" class="ud-help-list">
        <div *ngIf="step === 'count'">Count the number of items in the trolley, enter the count below "Item Count", and click "Next".</div>
        <div *ngIf="step === 'review'">Check and mark the item(s) listed if they correspond with items in the trolley.</div>
      </div>
    </div>
    <mat-dialog-content class="ud-content">
      <div class="ud-stack">
        
          <!-- Step 1: count -->
          <div *ngIf="step === 'count'" class="ud-section">
            <div class="ud-item-title">{{ data.item.name }}</div>
            <div class="ud-field-wrap">
              <div class="ud-label-pop">Item Count:</div>
              <div class="ud-qty-control" role="group" aria-label="Adjust item count">
                <button mat-mini-fab type="button" color="primary" class="ud-qty-btn" aria-label="Decrease item count" (click)="decrementUsed()">
                  <mat-icon class="ud-qty-icon">remove</mat-icon>
                </button>
                <mat-form-field appearance="fill" class="ud-field ud-field-pop">
                  <input matInput type="number" min="0" [max]="maxUsed" [(ngModel)]="used" (ngModelChange)="onUsedChange($event)" aria-label="Item count" />
                </mat-form-field>
                <button mat-mini-fab type="button" color="primary" class="ud-qty-btn" aria-label="Increase item count" (click)="incrementUsed()">
                  <mat-icon class="ud-qty-icon">add</mat-icon>
                </button>
              </div>
            </div>

            <div *ngIf="error" class="ud-error">{{ error }}</div>
            <div *ngIf="countMismatch || depletionNotice" class="ud-error-mismatch">
              <div *ngIf="countMismatch">{{ countMismatch.message }}</div>
              <div *ngIf="depletionNotice">{{ depletionNotice }}</div>
              <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
                <button mat-stroked-button (click)="cancelNotice()">Cancel</button>
                <button mat-flat-button color="primary" (click)="confirmNotice()">Continue</button>
              </div>
            </div>
          </div>

          <!-- Step 2: review instances (same table used for multiple-required flow) -->
          <div *ngIf="step === 'review'" class="ud-section">
            <div class="ud-item-title small">{{ data.item.name }} - Required: {{ data.item.controlQuantity }} item(s)</div>

            <table class="ud-table">
              <thead>
                <tr>
                  <th class="ud-th">Checked</th>
                  <th class="ud-th">Item</th>
                  <th class="ud-th">Description</th>
                  <th class="ud-th">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let instance of data.instances; let i = index" [class.ud-row-selected]="selectedIndices.has(i)" [class.ud-row-depleted]="isInstanceDisabled(i)">
                  <td class="ud-td center" (click)="toggleItemSelection(i)">
                    <label class="ud-checkbox-wrap" [class.ud-checkbox-disabled]="isInstanceDisabled(i)">
                      <input type="checkbox" [checked]="selectedIndices.has(i)" (click)="$event.stopPropagation(); toggleItemSelection(i)" [disabled]="isInstanceDisabled(i)" />
                    </label>
                  </td>
                  <td class="ud-td" (click)="$event.stopPropagation(); openInstanceDetail(i)">{{ instance.name }} </td>
                  <td class="ud-td"> {{ instance.description  }}</td>
                  <td class="ud-td">
                    <mat-form-field appearance="fill" style="width:140px;">
                      <input matInput [matDatepicker]="picker" [(ngModel)]="editableDates[i]" (click)="$event.stopPropagation()" placeholder="dd/MM/yyyy" class="ud-input" />
                      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                      <mat-datepicker #picker></mat-datepicker>
                    </mat-form-field>
                    <div *ngIf="isInstanceDisabled(i)" style="margin-top:6px;">
                      <button mat-flat-button color="accent" class="ud-add-btn" matTooltip="Replace this Item" aria-label="Replace instance" (click)="$event.stopPropagation(); onAddInstance(i)">+</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="errorMultiple" class="ud-error-multiple">{{ errorMultiple }}</div>
            <div *ngIf="warningMultiple" class="ud-error-mismatch">{{ warningMultiple }}</div>
            <div *ngIf="limitNotice" class="ud-error-mismatch">{{ limitNotice }}</div>
          </div>  
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()" class="ud-cancel">Cancel</button>
      <button *ngIf="step === 'review'" mat-button (click)="back()">Back</button>
      <button mat-flat-button color="primary" class="ud-save" (click)="step === 'count' ? next() : save()">{{ step === 'count' ? 'Next' : (data.isMultipleRequired ? 'Confirm Selection' : 'Confirm Selection') }}</button>
    </mat-dialog-actions>
  `
  ,
  styles: [
  `:host { font-family: 'Roboto', 'Helvetica', Arial, sans-serif; color: var(--color-text); }
    .ud-content { max-height: 60vh; overflow:auto; padding:var(--space-lg) var(--space-md); box-sizing:border-box; }
    .ud-stack { display:flex; flex-direction:column; gap:var(--space-md); }
    .ud-section { display:flex; flex-direction:column; gap:var(--space-md); }
    .ud-help-box { background:var(--bg-pale); border:1px solid rgba(230,242,248,0.9); padding:var(--space-sm); border-radius:var(--radius-md); margin:8px 0 12px 0; }
    .ud-tip-icon { color: var(--color-primary); }
    .ud-help-list { margin-top:6px; color:#334155; font-size:0.95rem; }
    .ud-help-header { display:flex; align-items:center; gap:8px; cursor:pointer; }
    .ud-help-chevron { margin-left:auto; transition:transform .18s ease; }
    .ud-help-chevron.open { transform:rotate(180deg); }
    .ud-header { display:flex; align-items:center; gap:8px; }
    .ud-close-btn { margin-left:auto; color: var(--color-subtle); }
    .ud-title { font-size:1.125rem; font-weight:700; margin:0 0 var(--space-sm) 0; color:#0f172a; }
    .ud-item-title { font-weight:700; color: var(--color-text); font-size:1rem; }
    .ud-item-title.small { font-size:0.95rem; color: var(--color-subtle); }
    .ud-field { width:160px; }
    .ud-field-pop { width:140px; }
    .ud-qty-control { display:flex; align-items:center; gap:var(--space-sm); }
    .ud-qty-btn {
      width:40px;
      height:40px;
      min-width:40px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-primary-600);
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .ud-qty-btn:hover { transform: scale(1.06); }
    .ud-qty-btn:active { transform: scale(0.98); }
    .ud-qty-btn:focus-visible { outline: 2px solid var(--color-primary-600); outline-offset: 2px; }
    .ud-qty-icon { font-size:1.3rem; width:1.3rem; height:1.3rem; font-weight:700; }
    .ud-field-pop input[type=number]::-webkit-outer-spin-button,
    .ud-field-pop input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .ud-field-pop input[type=number] { -moz-appearance: textfield; appearance: textfield; }
    .ud-field-pop input[matInput] { text-align:center; font-size:1.08rem; font-weight:600; }
    .ud-input { width:120px; padding:var(--space-xs) var(--space-sm); border:1px solid var(--color-border); border-radius:var(--radius-sm); font-size:0.95rem; }
    .ud-error { color: var(--color-danger); }
    .ud-label-pop { font-weight:700; color:#083344; font-size:0.95rem; background: linear-gradient(90deg,var(--bg-pale),var(--bg-info)); padding:var(--space-xs) var(--space-sm); border-radius:var(--radius-md); box-shadow:0 2px 6px rgba(2,6,23,0.06); display:inline-block; }
    .ud-field-wrap { display:flex; flex-direction:column; gap:var(--space-xs); }
    .sr-only { position: absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    .ud-error-multiple { color:#7f1d1d; padding:8px; background: var(--bg-danger); border-radius:6px; }
    .ud-error-mismatch { color:#92400e; padding:12px; background: var(--bg-warning); border:1px solid #fcd34d; border-radius:6px; margin-top:var(--space-sm); }
    .ud-table { width:100%; border-collapse:collapse; font-size:0.95rem; table-layout:fixed; }
    .ud-th { padding:10px 8px; text-align:left; font-weight:600; background: var(--bg-info); border-bottom:1px solid rgba(219,234,254,0.9); }
    .ud-td { padding:10px 8px; border-bottom:1px solid var(--color-surface-3); vertical-align:middle; }
    /* Column sizing for consistent alignment */
    .ud-table th:nth-child(1), .ud-table td:nth-child(1) { width:60px; text-align:center; }
    .ud-table th:nth-child(2), .ud-table td:nth-child(2) { width:28%; }
    .ud-table th:nth-child(3), .ud-table td:nth-child(3) { width:32%; }
    .ud-table th:nth-child(4), .ud-table td:nth-child(4) { width:140px; }
    .ud-table th:nth-child(5), .ud-table td:nth-child(5) { width:80px; text-align:center; }
    .ud-input { width:100%; box-sizing:border-box; }
    .ud-row-selected { background: #f8fbff; }
    .ud-row-depleted { opacity:0.45; }
    /* make checkbox cell easier to click */
    .ud-checkbox-wrap { display:flex; align-items:center; justify-content:center; width:100%; height:100%; padding:6px; box-sizing:border-box; }
    .ud-checkbox-wrap input[type="checkbox"] { width:22px; height:22px; cursor:pointer; }
    .ud-checkbox-wrap.ud-checkbox-disabled { cursor:default; opacity:0.9; }
    .ud-table tbody tr .ud-td.center { cursor:pointer; }
    .ud-table tbody tr .ud-td.center input[type="checkbox"] { cursor:pointer; }
    .center { text-align:center; }
    /* Prominent, discoverable add-replacement button */
    .ud-add-btn {
      min-width:36px;
      width:36px;
      height:36px;
      border-radius:50%;
      padding:0;
      font-weight:700;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      box-shadow: 0 4px 10px rgba(2,6,23,0.12);
      transform-origin:center;
      animation: ud-pop 1100ms ease-in-out infinite alternate;
      cursor: pointer;
    }
    .ud-add-btn:focus { outline: 3px solid rgba(34,197,94,0.18); }
    @keyframes ud-pop {
      from { transform: scale(1); box-shadow: 0 4px 10px rgba(2,6,23,0.12); }
      to   { transform: scale(1.07); box-shadow: 0 8px 18px rgba(2,6,23,0.18); }
    }
    .ud-cancel { color: var(--color-subtle); }
    .ud-save { background: linear-gradient(90deg,var(--color-primary),var(--color-primary-600)); color:white; }
    ::ng-deep .mat-form-field-appearance-fill .mat-mdc-form-field-flex { background: var(--color-surface); border-radius:var(--radius-sm); }
    `]
})
/**
 * UsageDialogComponent
 * Dialog used to record and review item usage for a checklist.
 *
 * Flow:
 *  - 'count' step: user enters a numeric count of items observed.
 *  - 'review' step: user inspects generated item instances and marks
 *    which are present and which have been inspected (Checked).
 */
export class UsageDialogComponent {
  // Numeric count entered by the user on the 'count' step
  used: number = 0;
  get maxUsed(): number {
    return (this.data?.item?.controlQuantity ?? 0) + 5;
  }
  // Validation message for numeric entry
  error: string | null = null;
  // Validation message shown during review when selection rules fail
  errorMultiple: string | null = null;
  // Non-blocking warning shown during review when counted > required but selections equal required
  warningMultiple: string | null = null;
  // Indices the user has 'Checked' (left column) in the review table
  selectedIndices: Set<number> = new Set();
  // Editable expiry dates keyed by instance index (store Date objects for datepicker)
  editableDates: Record<number, Date | null> = {};
  // Help panel toggle
  showHelp: boolean = true;
  // Current dialog step
  step: 'count' | 'review' = 'count';
  // If entered count differs from required, an explanatory message
  countMismatch: { reason: 'low' | 'high'; message: string } | null = null;
  // indices that should be shown as depleted/disabled in review (grayed out)
  instanceDisabled: Set<number> = new Set();
  // indices auto-disabled because the user reached the allowed selected+present limit
  instanceAutoDisabled: Set<number> = new Set();
  // maximum number of instances that may be selected+present in review (controlled by `used` when multiple-required)
  maxSelectable: number = Infinity;
  // notice shown when auto-disabling occurs
  limitNotice: string | null = null;
  // depletion notice message shown inline in the dialog when required>count
  depletionNotice: string | null = null;
  // whether the dialog flow began with a counted-zero (depleted) state
  startedDepleted: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<UsageDialogComponent>,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private globalSnack: GlobalSnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.used = 0;
    // Initialize all items as available by default and copy their expiry dates
    if (this.data?.instances) {
      this.initInstanceState(this.data.instances);
    }
  }

  private parseDate(dateString: string | Date | null | undefined): Date | null {
    return parseAnyDate(dateString);
  }

  onUsedChange(value: number | string | null) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      this.used = 0;
      return;
    }
    this.used = Math.min(this.maxUsed, Math.max(0, parsed));
  }

  incrementUsed() {
    this.used = Math.min(this.maxUsed, (Number(this.used) || 0) + 1);
    this.error = null;
  }

  decrementUsed() {
    this.used = Math.max(0, (Number(this.used) || 0) - 1);
    this.error = null;
  }


  toggleHelp() {
    this.showHelp = !this.showHelp;
  }

  back() {
    if (this.step === 'review') this.step = 'count';
  }

  next() {
    // validate count and prepare instances for review
    const q = this.data.item?.controlQuantity ?? 0;
    if (this.used == null || isNaN(this.used) || this.used < 0) {
      this.error = 'Enter a valid number.';
      return;
    }
    this.error = null;

    // ensure there is an instances array to review (generate if missing)
    if (!this.data.instances || !Array.isArray(this.data.instances) || this.data.instances.length === 0) {
      this.data.instances = generateInstances(this.data.item || {});
    }

    if (typeof q === 'number') {
      // If used equals required, complete this item immediately and return to the list
      // so the next item starts again from step 1.
      if (this.used === q) {
        if (this.data.isMultipleRequired) {
          const instancesAll = Array.isArray(this.data.instances) ? this.data.instances : [];
          const availableLimit = Math.min(Math.max(0, this.used), instancesAll.length);
          const availableIndices = instancesAll.map((_: any, idx: number) => idx).slice(0, availableLimit);
          const depletedIndices = instancesAll.map((_: any, idx: number) => idx).slice(availableLimit);
          this.closeResult({
            used: this.used,
            availableCount: this.used,
            notAvailableCount: 0,
            autoAdvance: true,
            updatedDates: this.formatEditableDates(),
            availableIndices,
            depletedIndices
          });
          return;
        }
        this.closeResult({ used: this.used, autoAdvance: true });
        return;
      }

      // If used is lower than required, go directly to step 2 for review/selection.
      if (this.used < q) {
        this.countMismatch = null;
        this.depletionNotice = null;
        this.startedDepleted = false;
        this.prepareInstancesAndReview();
        return;
      }

      // If used is greater than required, keep existing warning/confirmation flow.
      const reason: 'high' = 'high';
      const msg = `Entered count (${this.used}) is greater than required (${q}). Recount to avoid double-counting. Click "Cancel" to correct the count, or "Continue" to proceed to the review and indicate which items are present.`;
      this.countMismatch = { reason, message: msg };
      return;
    }

    // otherwise proceed to prepare and show review
    this.prepareInstancesAndReview();
  }

  private prepareInstancesAndReview() {
    // initialize selection state for instances
    this.initInstanceState(this.data.instances || []);
    // If the user counted zero for a single required item, mark that instance depleted
    const q = this.data.item?.controlQuantity ?? 0;
    if (q >= 1 && this.used === 0) {
      // mark all instance rows as depleted
      (this.data.instances || []).forEach((_: any, idx: number) => this.setInstancePresent(idx, false));
    }
    // For multiple-required flows, determine the maximum selectable count from entered `used` (availableCount)
    if (this.data.isMultipleRequired) {
      const required = this.data.item?.controlQuantity ?? 0;
      const effective = this.startedDepleted ? 0 : ((typeof this.used === 'number' && this.used >= 0) ? this.used : required);
      this.maxSelectable = effective;
    } else {
      this.maxSelectable = Infinity;
    }
    // enforce limit immediately so UI reflects allowed selections
    this.enforceMaxSelection();
    this.step = 'review';
  }

  // Public wrapper used by template to avoid calling private methods from markup
  skipAndContinue() {
    this.countMismatch = null;
    this.prepareInstancesAndReview();
  }

  continueFromDepleted() {
    this.depletionNotice = null;
    this.prepareInstancesAndReview();
  }

  cancelNotice() {
    this.countMismatch = null;
    this.depletionNotice = null;
  }

  confirmNotice() {
    if (this.countMismatch) {
      this.skipAndContinue();
      return;
    }
    if (this.depletionNotice) {
      this.continueFromDepleted();
      return;
    }
  }

  toggleItemSelection(index: number) {
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
    } else {
      // if adding this selection would exceed the allowed limit, ignore and enforce auto-disable
      const instancesAll = Array.isArray(this.data.instances) ? this.data.instances : [];
      const presentAndSelectedCount = instancesAll
        .map((_: any, idx: number) => idx)
        .filter((i: number) => !this.instanceDisabled.has(i) && this.selectedIndices.has(i)).length;
      const willBe = presentAndSelectedCount + 1;
      if (this.data.isMultipleRequired && typeof this.maxSelectable === 'number' && isFinite(this.maxSelectable) && willBe > this.maxSelectable) {
        // reached limit: do not add, just enforce disabling for other rows and show notice
        this.enforceMaxSelection();
        return;
      }
      this.selectedIndices.add(index);
    }
    this.enforceMaxSelection();
  }

  // (Removed separate 'present' toggle; checking is done via `selectedIndices`)

  // Ensure user has selected at least the required number of instances.
  private validateSelection(required: number): boolean {
    if (this.selectedIndices.size === 0) {
      this.errorMultiple = `Please check at least 1 item.`;
      return false;
    }
    if (this.selectedIndices.size < required) {
      this.errorMultiple = `Please check ${required} item(s). Currently checked: ${this.selectedIndices.size}`;
      return false;
    }
    return true;
  }

  /**
   * Initialize internal selection and availability maps for a list of instances.
   * Resets previous selections and seeds editable expiry dates.
   */
  private initInstanceState(instances: any[]) {
    this.selectedIndices = new Set();
    this.editableDates = {};
    this.instanceAutoDisabled.clear();
    this.limitNotice = null;
    instances.forEach((inst: any, idx: number) => {
      // default to unchecked/available
      this.instanceDisabled.delete(idx);
      const parsed = this.parseDate(inst.expiryDate ?? null);
      this.editableDates[idx] = parsed; // keep Date|null for datepicker
    });
  }

  /**
   * Central helper to mark an instance present or not and update related state.
   * @param index instance index
   * @param present whether instance is present (true) or depleted (false)
   * @param select when true and present=true also add to `selectedIndices`
   */
  private setInstancePresent(index: number, present: boolean, select: boolean = false) {
    if (present) {
      this.instanceDisabled.delete(index);
      if (select) this.selectedIndices.add(index);
    } else {
      this.instanceDisabled.add(index);
      this.selectedIndices.delete(index);
    }
  }

  /**
   * Return whether an instance should be considered disabled in the UI.
   */
  isInstanceDisabled(index: number): boolean {
    return this.instanceDisabled.has(index) || this.instanceAutoDisabled.has(index);
  }

  /**
   * Enforce the configured `maxSelectable` limit by auto-disabling extra present-but-unselected rows.
   */
  private enforceMaxSelection() {
    this.instanceAutoDisabled.clear();
    this.limitNotice = null;
    if (!this.data?.isMultipleRequired || !isFinite(this.maxSelectable)) return;
    const instancesAll = Array.isArray(this.data.instances) ? this.data.instances : [];
    const allIndices = instancesAll.map((_: any, idx: number) => idx);
    const checkedCount = this.selectedIndices.size;
    // Only auto-disable other available rows once the user has selected the allowed number
    if (checkedCount >= this.maxSelectable) {
      const toDisable = allIndices.filter((i: number) => !this.selectedIndices.has(i) && !this.instanceDisabled.has(i));
      toDisable.forEach((idx: number) => this.instanceAutoDisabled.add(idx));
      if (this.instanceAutoDisabled.size > 0) {
        this.limitNotice = `Limit reached: only ${this.maxSelectable} item(s) may be checked.`;
      }
    } else {
      this.instanceAutoDisabled.clear();
    }
  }

  /**
   * Replace an instance at index with new data and update editable date.
   */
  private replaceInstanceAt(index: number, newData: any) {
    const instances = this.data.instances || [];
    instances[index] = { ...(instances[index] || {}), ...(newData || {}) };
    // ensure editable date updated
    const parsed = this.parseDate(instances[index].expiryDate ?? null);
    this.editableDates[index] = parsed ?? (this.editableDates[index] ?? null);
    // reassign array to trigger change detection consumers
    this.data.instances = [...instances];
  }

  /** Open replace dialog for a depleted instance and apply returned expiry. */
  onAddInstance(index: number) {
    const inst = (this.data.instances || [])[index];
    if (!inst) return;
    // Pass a shallow clone containing only the instance fields so ReplaceDialog
    // treats this as a single instance (not a multi-variant item).
    const instClone: any = { ...inst };
    // Remove collection fields that could make ReplaceDialog render variants
    delete instClone.items;
    delete instClone.variants;
    delete instClone.expiryDates;
    const ref = this.matDialog.open(ReplaceDialogComponent, { data: { item: instClone }, width: '520px' });
    ref.afterClosed().subscribe((res: any) => {
      console.log('Replace dialog closed, result:', res);
      if (!res) return;
      // Merge returned result into the instance so the UI shows the replacement
      const current = (this.data.instances || [])[index] || {};
      if (res.items && Array.isArray(res.items) && res.items.length) {
        this.replaceInstanceAt(index, res.items[0]);
      } else if (res.expiryDate) {
        this.replaceInstanceAt(index, { expiryDate: res.expiryDate });
      }
      // mark as present/selectable (replacement applied)
      this.setInstancePresent(index, true, true);
      // notify caller to persist replacement immediately (updates replacement card)
      try {
        const cb = (this.data as any).onReplaceImmediate;
        if (typeof cb === 'function') cb(index, (this.data.instances || [])[index]);
      } catch (e) {
        console.warn('onReplaceImmediate callback failed', e);
      }
      // clear any depletion notice or errors now replacement applied
      this.depletionNotice = null;
      this.errorMultiple = null;
      this.error = null;
      // notify user and force change detection so UI updates immediately
      this.globalSnack.show('Replacement applied', 3000);
      console.log('after replacement - instanceDisabled:', Array.from(this.instanceDisabled), 'selectedIndices:', Array.from(this.selectedIndices));
      this.cdr.detectChanges();
    });
  }

  openInstanceDetail(index: number) {
    const inst = (this.data.instances || [])[index];
    if (!inst) return;
    const safeName = (inst as any).name ?? (inst as any).description ?? (this.data?.item?.name ?? 'Item');
    const safeCategory = (inst as any).category ?? (this.data?.item?.category ?? '');
    this.matDialog.open(InstanceDetailDialogComponent, { data: { name: safeName, category: safeCategory }, width: '380px' });
  }

  private closeResult(payload?: any) {
    this.dialogRef.close(payload);
  }
 
  save() {
    // clear previous errors
    this.errorMultiple = null;

    // Centralized validation for any edited expiry dates
    const edited = this.formatEditableDates();
    const res = validateEditableDates(edited);
    if (!res.valid) {
      this.globalSnack.show(res.message || 'Invalid dates');
      return;
    }

    if (this.data.isMultipleRequired) {
      // For multiple required items, allow confirm when no instances are present (all depleted)
      const required = this.data.item.controlQuantity ?? 0;
      if (Array.isArray(this.data.instances) && this.data.instances.length > 0) {
        const instances = this.data.instances;
        const availableIndices = instances.map((_: any, idx: number) => idx).filter((i: number) => !this.instanceDisabled.has(i));
        // If nothing available (all depleted), accept used:0 and return
        if (availableIndices.length === 0) {
          const req = this.data.item?.controlQuantity ?? 0;
          this.closeResult({ used: 0, updatedDates: this.formatEditableDates(), availableCount: 0, notAvailableCount: req });
          return;
        }
      }
      // Determine effective required count: prefer the user-entered `used` when provided
      const effectiveRequired = this.startedDepleted ? 0 : ((typeof this.used === 'number' && this.used >= 0) ? this.used : required);

      // Count how many instances are present (available) and how many are both present+checked
      const instancesAll = Array.isArray(this.data.instances) ? this.data.instances : [];
      const presentIndicesAll = instancesAll.map((_: any, idx: number) => idx).filter((i: number) => !this.instanceDisabled.has(i));
      const presentCount = presentIndicesAll.length;
      const selectedAndPresentCount = presentIndicesAll.filter((i: number) => this.selectedIndices.has(i)).length;

      // Clear prior messages
      this.errorMultiple = null;
      this.warningMultiple = null;

      // If not started depleted, require the user to mark at least `effectiveRequired` rows present+checked
      if (!this.startedDepleted && effectiveRequired > 0 && selectedAndPresentCount < effectiveRequired) {
        // Special case: counted more than controlQuantity but user has selected exactly the controlQuantity.
        // Show a non-blocking warning and allow confirmation.
        if (effectiveRequired > required && selectedAndPresentCount === required) {
          this.warningMultiple = `Entered count (${effectiveRequired}) is greater than required (${required}). You have marked ${required} items present — remove extras from the trolley if applicable, or confirm to proceed.`;
          // do not return; allow confirmation
        } else {
          this.errorMultiple = `Please mark ${effectiveRequired} item(s) present and checked. Currently marked: ${selectedAndPresentCount}`;
          return;
        }
      }

      // availableCount should reflect how many items are both present and checked
      const availableCount = selectedAndPresentCount;
      const notAvailableCount = Math.max(0, effectiveRequired - selectedAndPresentCount);

      // Provide explicit indices so callers can mark which per-instance entries were present
      const presentAndCheckedIndices = presentIndicesAll.filter((i: number) => this.selectedIndices.has(i));
      const allIndices = instancesAll.map((_: any, idx: number) => idx);
      const depletedIndices = allIndices.filter((i: number) => presentAndCheckedIndices.indexOf(i) === -1);

      // Return `used` as the effective available count and include index lists so callers
      // can update per-instance availability / replacement flags in the inventory model.
      this.closeResult({ used: availableCount, availableCount, notAvailableCount, updatedDates: this.formatEditableDates(), availableIndices: presentAndCheckedIndices, depletedIndices });
      return;
    }

    // Single-item / standard flow
    const q = this.data.item.controlQuantity ?? 0;

    // If there are instance rows (review UI), apply the checked/present rules
    if (Array.isArray(this.data.instances) && this.data.instances.length > 0) {
      const instances = this.data.instances;
      const presentIndices = instances.map((_: any, idx: number) => idx).filter((i: number) => !this.instanceDisabled.has(i));
      const presentCount = presentIndices.length;

      // If nothing marked present, allow confirm (used: 0)
      if (presentCount === 0) {
        this.closeResult({ used: 0, updatedDates: this.formatEditableDates() });
        return;
      }

      // If some are marked present, ensure at least one of those is Checked (left column)
      const selectedPresentCount = presentIndices.filter((i: number) => this.selectedIndices.has(i)).length;
      if (selectedPresentCount === 0) {
        if (!this.startedDepleted && !this.validateSelection(q)) return;
      }

      // Present items are also Checked — accept and return presentCount
      this.closeResult({ used: presentCount, updatedDates: this.formatEditableDates() });
      return;
    }

    // Fallback: numeric entry validation
    if (this.used == null || isNaN(this.used) || this.used < 0) {
      this.error = 'Enter a valid number.';
      return;
    }
    if (this.used > q + 5) {
      this.error = `Cannot use more than available (${q}).`;
      return;
    }
    this.closeResult({ used: this.used });
  }

  close() {
    this.closeResult();
  }

  private formatEditableDates(): Record<number, string | null> {
    const out: Record<number, string | null> = {};
    for (const k of Object.keys(this.editableDates)) {
      const idx = Number(k);
      const d = this.editableDates[idx];
      out[idx] = d ? (formatDDMMYYYY(d) || null) : null;
    }
    return out;
  }
}
