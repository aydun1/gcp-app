import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingViewComponent } from './recycling-view.component';

describe('RecyclingViewComponent', () => {
  let component: RecyclingViewComponent;
  let fixture: ComponentFixture<RecyclingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
