import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingScheduleListComponent } from './loading-schedule-list.component';

describe('LoadingScheduleListComponent', () => {
  let component: LoadingScheduleListComponent;
  let fixture: ComponentFixture<LoadingScheduleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingScheduleListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingScheduleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
