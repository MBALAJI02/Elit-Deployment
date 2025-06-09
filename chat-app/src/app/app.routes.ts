import { Routes } from '@angular/router';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatConverstationComponent } from './chat-converstation/chat-converstation.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'chat-list', component: ChatListComponent },
    { path: 'chat-conversation/:id', component: ChatConverstationComponent },
    { path: 'chat', component: ChatContainerComponent }
];
