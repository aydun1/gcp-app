import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferRequestedComponent } from './interstate-transfer-requested.component';

describe('InterstateTransferRequestedComponent', () => {
  let component: InterstateTransferRequestedComponent;
  let fixture: ComponentFixture<InterstateTransferRequestedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferRequestedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferRequestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
