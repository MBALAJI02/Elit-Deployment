import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatcontainerComponent } from './chat-container.component';

describe('ChatcontainerComponent', () => {
  let component: ChatcontainerComponent;
  let fixture: ComponentFixture<ChatcontainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatcontainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatcontainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
