import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortingVisualizer } from './sorting-visualizer';

describe('SortingVisualizer', () => {
  let component: SortingVisualizer;
  let fixture: ComponentFixture<SortingVisualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortingVisualizer],
    }).compileComponents();

    fixture = TestBed.createComponent(SortingVisualizer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
