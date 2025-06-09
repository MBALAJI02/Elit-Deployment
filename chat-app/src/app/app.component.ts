import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatListComponent } from './chat-list/chat-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'chat-app';
}
