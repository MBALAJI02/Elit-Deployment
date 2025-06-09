import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatConverstationComponent } from '../chat-converstation/chat-converstation.component';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [CommonModule, ChatListComponent, ChatConverstationComponent],
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.css']
})
export class ChatContainerComponent {
  isChatExpanded: boolean = false;
  selectedUser: string | null = null;

  onUserSelected(user: string) {
    this.selectedUser = user;
  }

  toggleChatView() {
  this.isChatExpanded = !this.isChatExpanded;
}

}

