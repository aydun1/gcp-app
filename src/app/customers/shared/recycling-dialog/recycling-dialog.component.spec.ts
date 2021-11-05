import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingDialogComponent } from './recycling-dialog.component';

describe('RecyclingDialogComponent', () => {
  let component: RecyclingDialogComponent;
  let fixture: ComponentFixture<RecyclingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
