import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdsListComponent } from './sds-list.component';

describe('SdsListComponent', () => {
  let component: SdsListComponent;
  let fixture: ComponentFixture<SdsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SdsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
