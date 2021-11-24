import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CageWeightsComponent } from './cage-weights.component';

describe('CageWeightsComponent', () => {
  let component: CageWeightsComponent;
  let fixture: ComponentFixture<CageWeightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CageWeightsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CageWeightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
