import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanListSimpleComponent } from './pan-list-simple.component';

describe('LoadingScheduleListComponent', () => {
  let component: PanListSimpleComponent;
  let fixture: ComponentFixture<PanListSimpleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanListSimpleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanListSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
