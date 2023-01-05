import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransfersActiveComponent } from './interstate-transfers-active.component';

describe('InterstateTransfersActiveComponent', () => {
  let component: InterstateTransfersActiveComponent;
  let fixture: ComponentFixture<InterstateTransfersActiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransfersActiveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransfersActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
