import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingReceiptNewComponent } from './recycling-receipt-new.component';

describe('RecyclingReceiptNewComponent', () => {
  let component: RecyclingReceiptNewComponent;
  let fixture: ComponentFixture<RecyclingReceiptNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingReceiptNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingReceiptNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
