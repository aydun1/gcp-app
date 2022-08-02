import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunPickerDialogComponent } from './run-picker-dialog.component';

describe('RunPickerDialogComponent', () => {
  let component: RunPickerDialogComponent;
  let fixture: ComponentFixture<RunPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RunPickerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RunPickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});