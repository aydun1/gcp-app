import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanListITTComponent } from './pan-list-itt.component';

describe('PanListITTComponent', () => {
  let component: PanListITTComponent;
  let fixture: ComponentFixture<PanListITTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanListITTComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanListITTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
