import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSiteDialogComponent } from './customer-site-dialog.component';

describe('CustomerSiteDialogComponent', () => {
  let component: CustomerSiteDialogComponent;
  let fixture: ComponentFixture<CustomerSiteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerSiteDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerSiteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
