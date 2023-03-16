import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChemicalOthersDialogComponent } from './chemical-others-dialog.component';

describe('ChemicalOthersDialogComponent', () => {
  let component: ChemicalOthersDialogComponent;
  let fixture: ComponentFixture<ChemicalOthersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChemicalOthersDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChemicalOthersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
