import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoLogin } from './demo-login';

describe('DemoLogin', () => {
  let component: DemoLogin;
  let fixture: ComponentFixture<DemoLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
