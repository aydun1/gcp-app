import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferListComponent } from './interstate-transfer-list.component';

describe('LoadingScheduleListComponent', () => {
  let component: InterstateTransferListComponent;
  let fixture: ComponentFixture<InterstateTransferListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
