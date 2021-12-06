import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadControlComponent } from './upload-control.component';

describe('UploadControlComponent', () => {
  let component: UploadControlComponent;
  let fixture: ComponentFixture<UploadControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
