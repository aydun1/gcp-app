import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferPanListComponent } from './interstate-transfer-pan-list.component';

describe('LoadingScheduleListComponent', () => {
  let component: InterstateTransferPanListComponent;
  let fixture: ComponentFixture<InterstateTransferPanListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferPanListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferPanListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
