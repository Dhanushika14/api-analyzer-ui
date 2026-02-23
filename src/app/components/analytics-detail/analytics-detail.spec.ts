import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsDetail } from './analytics-detail';

describe('AnalyticsDetail', () => {
  let component: AnalyticsDetail;
  let fixture: ComponentFixture<AnalyticsDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyticsDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
