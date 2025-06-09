import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class ChatService {

  // public reqUrl = 'http://localhost:3000'  
  public reqUrl = 'https://chat-app-server-eight-sepia.vercel.app'  

  //Register
  public Service_sendOTP = this.reqUrl + '/send-otp'
  public Service_verifyOTP = this.reqUrl + '/verify-otp'

  //Login 
  public Service_checkContact = this.reqUrl + '/check-contact'
  public Service_saveUsername = this.reqUrl + '/save-username'
  public Service_checkContactExist = this.reqUrl + '/check-contact-exist'
  public Service_checkUserName = this.reqUrl + '/check-username'

  //chat-list
  public Service_searchUser = this.reqUrl + '/search-user'
  public Service_getMessagedUser = this.reqUrl + '/get-messaged-users'
  public Service_getUnreadMessage = this.reqUrl + '/get-unread-messages'
  public Service_sendMessage = this.reqUrl + '/send-message'
  public Service_markMessagesRead = this.reqUrl + '/mark-messages-read'

  //Chat-Conversation
  public Service_getMessages = this.reqUrl + '/get-messages'
  public Service_sendMessages = this.reqUrl + '/send-message'
  public Service_clearMessages = this.reqUrl + '/clear-message'


}
