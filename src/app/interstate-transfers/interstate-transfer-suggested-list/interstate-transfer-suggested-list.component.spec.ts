import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterstateTransferSuggestedListComponent } from './interstate-transfer-suggested-list.component';

describe('InterstateTransferSuggestedListComponent', () => {
  let component: InterstateTransferSuggestedListComponent;
  let fixture: ComponentFixture<InterstateTransferSuggestedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterstateTransferSuggestedListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterstateTransferSuggestedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
