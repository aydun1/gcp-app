import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingNewComponent } from './recycling-new.component';

describe('RecyclingNewComponent', () => {
  let component: RecyclingNewComponent;
  let fixture: ComponentFixture<RecyclingNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
