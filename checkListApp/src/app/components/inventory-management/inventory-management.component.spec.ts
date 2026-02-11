import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InventoryManagementComponent } from './inventory-management.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('InventoryManagementComponent (usedToday)', () => {
  let fixture: ComponentFixture<InventoryManagementComponent>;
  let component: InventoryManagementComponent;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [InventoryManagementComponent, MatDialogModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryManagementComponent);
    component = fixture.componentInstance;
  });

  it('updates usedToday when Replace dialog returns partial variant replacements', (done) => {
    // Prepare an item with 3 variants, one initially unavailable
    const item = {
      id: 123,
      name: 'Test Item',
      controlQuantity: 3,
      items: [
        { expiryDate: '01/01/2030', available: true },
        { expiryDate: '01/01/2030', available: false, needsReplacement: true },
        { expiryDate: '01/01/2030', available: true }
      ],
      expiryDate: '01/01/2030'
    };

    component.inventory.set([item]);
    fixture.detectChanges();

    // Simulate Replace dialog returning updated second variant (making it available)
    const returned = {
      items: [
        { expiryDate: '01/01/2030' },
        { expiryDate: '01/01/2035', isReplacement: true },
        { expiryDate: '01/01/2030' }
      ]
    };

    // Mock dialog.open(...).afterClosed() to return our `returned` payload
    const afterClosed = of(returned);
    dialogSpy.open.and.returnValue({ afterClosed: () => afterClosed } as any);

    // Call openReplaceDialog and wait a tick for async merge/enqueue
    component.openReplaceDialog(item);

    // Allow microtasks to flush and enqueue operations to complete
    setTimeout(() => {
      const updated = component.inventory().find((i: any) => i.id === 123);
      // Expect usedToday to reflect available variants (3 available after replacement)
      expect(updated.usedToday).toBe(3);
      done();
    }, 50);
  });

});
