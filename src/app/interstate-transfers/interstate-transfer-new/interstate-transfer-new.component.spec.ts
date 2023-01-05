import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferNewComponent } from './interstate-transfer-new.component';

describe('InterstateTransferNewComponent', () => {
  let component: InterstateTransferNewComponent;
  let fixture: ComponentFixture<InterstateTransferNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
