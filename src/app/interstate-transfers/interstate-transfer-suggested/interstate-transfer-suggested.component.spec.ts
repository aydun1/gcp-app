import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferSuggestedComponent } from './interstate-transfer-suggested.component';

describe('InterstateTransferSuggestedComponent', () => {
  let component: InterstateTransferSuggestedComponent;
  let fixture: ComponentFixture<InterstateTransferSuggestedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferSuggestedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferSuggestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
