import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemControlComponent } from './item-control.component';

describe('ItemControlComponent', () => {
  let component: ItemControlComponent;
  let fixture: ComponentFixture<ItemControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
