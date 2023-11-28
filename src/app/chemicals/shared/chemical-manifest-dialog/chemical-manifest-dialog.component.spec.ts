import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChemicalManifestDialogComponent } from './chemical-manifest-dialog.component';

describe('ChemicalManifestDialogComponent', () => {
  let component: ChemicalManifestDialogComponent;
  let fixture: ComponentFixture<ChemicalManifestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChemicalManifestDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChemicalManifestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
