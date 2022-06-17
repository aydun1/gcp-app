import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryEditorDialogComponent } from './delivery-editor-dialog.component';

describe('DeliveryEditorDialogComponent', () => {
  let component: DeliveryEditorDialogComponent;
  let fixture: ComponentFixture<DeliveryEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryEditorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});