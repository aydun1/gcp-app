import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchButtonComponent } from './branch-button.component';

describe('BranchButtonComponent', () => {
  let component: BranchButtonComponent;
  let fixture: ComponentFixture<BranchButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BranchButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BranchButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
