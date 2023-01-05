import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdsViewComponent } from './sds-view.component';

describe('SdsViewComponent', () => {
  let component: SdsViewComponent;
  let fixture: ComponentFixture<SdsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SdsViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
