import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatConverstationComponent } from './chat-converstation.component';

describe('ChatConverstationComponent', () => {
  let component: ChatConverstationComponent;
  let fixture: ComponentFixture<ChatConverstationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatConverstationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatConverstationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
