import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetterheadComponent } from './letterhead.component';

describe('LetterheadComponent', () => {
  let component: LetterheadComponent;
  let fixture: ComponentFixture<LetterheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LetterheadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetterheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
