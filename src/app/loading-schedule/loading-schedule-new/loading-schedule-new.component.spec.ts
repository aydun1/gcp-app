import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingScheduleNewComponent } from './loading-schedule-new.component';

describe('LoadingScheduleNewComponent', () => {
  let component: LoadingScheduleNewComponent;
  let fixture: ComponentFixture<LoadingScheduleNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingScheduleNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingScheduleNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
