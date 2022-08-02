import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingCustomerListDialogComponent } from './recycling-customer-list-dialog.component';

describe('RecyclingDocketViewComponent', () => {
  let component: RecyclingCustomerListDialogComponent;
  let fixture: ComponentFixture<RecyclingCustomerListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingCustomerListDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingCustomerListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
