import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdsManifestDialogComponent } from './sds-manifest-dialog.component';

describe('SdsManifestDialogComponent', () => {
  let component: SdsManifestDialogComponent;
  let fixture: ComponentFixture<SdsManifestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SdsManifestDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdsManifestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
