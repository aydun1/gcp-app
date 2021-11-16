import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CageDetailsComponent } from './cage-details.component';

describe('CageDetailsComponent', () => {
  let component: CageDetailsComponent;
  let fixture: ComponentFixture<CageDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CageDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CageDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
