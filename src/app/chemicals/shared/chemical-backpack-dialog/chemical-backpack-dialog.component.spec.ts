import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChemicalBackpackDialogComponent } from './chemical-backpack-dialog.component';

describe('ChemicalBackpackDialogComponent', () => {
  let component: ChemicalBackpackDialogComponent;
  let fixture: ComponentFixture<ChemicalBackpackDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChemicalBackpackDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChemicalBackpackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
