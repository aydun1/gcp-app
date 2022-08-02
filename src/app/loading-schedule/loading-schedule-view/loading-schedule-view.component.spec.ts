import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingScheduleViewComponent } from './loading-schedule-view.component';

describe('LoadingScheduleViewComponent', () => {
  let component: LoadingScheduleViewComponent;
  let fixture: ComponentFixture<LoadingScheduleViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingScheduleViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingScheduleViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
