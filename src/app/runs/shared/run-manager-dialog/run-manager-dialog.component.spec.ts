import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunManagerDialogComponent } from './run-manager-dialog.component';

describe('RunPickerDialogComponent', () => {
  let component: RunManagerDialogComponent;
  let fixture: ComponentFixture<RunManagerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RunManagerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RunManagerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});