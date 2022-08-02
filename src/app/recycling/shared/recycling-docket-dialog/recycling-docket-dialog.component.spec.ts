import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingDocketDialogComponent } from './recycling-docket-dialog.component';

describe('RecyclingDocketViewComponent', () => {
  let component: RecyclingDocketDialogComponent;
  let fixture: ComponentFixture<RecyclingDocketDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingDocketDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingDocketDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
