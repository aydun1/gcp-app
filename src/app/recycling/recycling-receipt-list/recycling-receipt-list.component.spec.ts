import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingReceiptListComponent } from './recycling-receipt-list.component';

describe('RecyclingReceiptListComponent', () => {
  let component: RecyclingReceiptListComponent;
  let fixture: ComponentFixture<RecyclingReceiptListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingReceiptListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingReceiptListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
