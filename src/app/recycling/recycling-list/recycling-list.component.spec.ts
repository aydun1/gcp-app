import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingListComponent } from './recycling-list.component';

describe('RecyclingListComponent', () => {
  let component: RecyclingListComponent;
  let fixture: ComponentFixture<RecyclingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecyclingListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecyclingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
