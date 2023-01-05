import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdsBackpackDialogComponent } from './sds-backpack-dialog.component';

describe('SdsBackpackDialogComponent', () => {
  let component: SdsBackpackDialogComponent;
  let fixture: ComponentFixture<SdsBackpackDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SdsBackpackDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdsBackpackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
