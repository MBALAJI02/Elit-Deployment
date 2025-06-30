import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  // public socket_connection = 'http://localhost:4000'
  public socket_connection = 'https://chat-app-socket-jph5.onrender.com'

  playNotificationSoundForChatList(): void {
    const audio = new Audio('assets/sounds/chat-list.mp3');
    audio.play().catch(err => console.warn('Sound play error:', err));
  }

  playNotificationSoundForChatConves(): void {
    const audio = new Audio('assets/sounds/chat-conversation.mp3');
    audio.play().catch(err => console.warn('Sound play error:', err));
  }

}
