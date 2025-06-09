import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { ChatService } from '../chat.service';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ChatListComponent {
  @Output() userSelected = new EventEmitter<string>();
  users: string[] = [];
  username: string | null = ''
  showSearchInput = false;
  searchQuery = '';
  searchedUsers: any[] = [];
  private socket!: Socket;
  typingStatus: { [username: string]: boolean } = {};
  loggedInUsername: string | null = localStorage.getItem('username');
  unreadMessages: { [username: string]: { count: number, lastMessageTime: Date, lastMessage: string } } = {};

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef,
    private chatService: ChatService,
    private webSocket: WebsocketService
  ) { }

  ngOnInit() {
    this.socket = io(this.webSocket.socket_connection);

    this.username = localStorage.getItem('username');
    if (!this.username) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.router.url == '/chat-list') {
        this.fetchMessagedUserFromDb();
      }
    });    

    this.newMesageSentAction();
    this.liveTypingAction();
    this.fetchMessagedUserFromDb();
    this.liveUnreadCountAction();
    this.fetchUnreadMessages();
  }

  fetchMessagedUserFromDb() {
    this.http.get<string[]>(this.chatService.Service_getMessagedUser +'/'+ this.username)
      .subscribe(
        res => this.users = res,
        err => console.error('Error fetching users:', err)
      );
  }

  fetchUnreadMessages() {
    this.http.get<{ username: string, count: number, lastMessageTime: Date, lastMessage: string }[]>(this.chatService.Service_getUnreadMessage +'/'+ this.username)
      .subscribe((unreadMessages) => {
        unreadMessages.forEach((message) => {
          this.unreadMessages[message.username] = { count: message.count, lastMessageTime: message.lastMessageTime, lastMessage: message.lastMessage };
          console.log("unreadMessages::::::::::::", this.unreadMessages[message.username])
        });
      });
  }

  getUnreadCount(user: string) {
    if (this.unreadMessages && this.unreadMessages[user]) {
      return this.unreadMessages[user].count;
    }
    return 0;
  }

  getMessageTime(user: string) {
    if (this.unreadMessages && this.unreadMessages[user]) {
      return this.unreadMessages[user].lastMessageTime;
    }
    return 0;

  }

  getLastMessage(user: string) {
    if (this.unreadMessages && this.unreadMessages[user]) {
      return this.unreadMessages[user].lastMessage;
    }
    return 0;
  }



  searchUser() {
    if (this.searchQuery.length > 0) {
      this.http.post<any[]>(this.chatService.Service_searchUser, { query: this.searchQuery }).subscribe(
        (res) => this.searchedUsers = res,
        (err) => console.error('Search error:', err)
      );
    } else {
      this.searchedUsers = [];
    }
  }

  sendMessageTo(user: string, message: string) {
    if (!message.trim()) return;
    const currentUser = this.loggedInUsername;
    this.http.post(this.chatService.Service_sendMessage, {from: currentUser, to: user, message: message }).subscribe(
      () => { },
      (err) => console.error('Message send error:', err)
    );
  }

  newMesageSentAction(){
    this.socket.on('new_message_sent', (data) => {
      if (data.to == this.loggedInUsername && !this.users.includes(data.from)) {
        this.users.unshift(data.from); 
        this.unreadMessages[data.from] = {
          count: 0,
          lastMessage: data.message,
          lastMessageTime: data.timestamp
        };
        this.cdRef.detectChanges();
      }
    });
  }


  liveTypingAction() {
    this.socket.on('user_typing_chatList', (data) => {
      if (data.to == this.loggedInUsername) {
        this.typingStatus[data.from] = true;
        setTimeout(() => {
          this.typingStatus[data.from] = false;
        }, 1000);
      }
    });
  }

  liveUnreadCountAction() {
    this.socket.on('update_unread', (data) => {
      const sender = data.from;
      const currentTime = new Date();

      if (data.to == this.loggedInUsername) {
        if (this.unreadMessages[sender]) {
          this.unreadMessages[sender].count += 1;
          this.unreadMessages[sender].lastMessageTime = currentTime;
          this.unreadMessages[sender].lastMessage = data.message;
        } else {
          this.unreadMessages[sender] = {
            count: 1,
            lastMessageTime: new Date(), 
            lastMessage: data.message
          };
        }
        this.cdRef.detectChanges();
      }
    });
  }

  openConversation(username: string) {
    this.http.post(this.chatService.Service_markMessagesRead, {from: this.username, to: username}, { responseType: 'text' }).subscribe(() => {
      this.unreadMessages[username] = { count: 0, lastMessageTime: new Date(), lastMessage: '' };
      if (window.innerWidth < 573) {
        this.router.navigate(['/chat-conversation', username]);
      } else {
        this.userSelected.emit(username);
      }
    });
  }


  addUserAction() {
    this.showSearchInput = true;
    this.searchedUsers = [];
    this.searchQuery = '';
  }

  searchCloseAction() {
    this.searchQuery = '';
    this.searchedUsers = [];
    this.showSearchInput = false;
  }

  logout() {
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}
