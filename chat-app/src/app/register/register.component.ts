import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  isEmailMode: boolean = false
  isOTPMode: boolean = false
  contact: string = '';
  otp: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private chatService: ChatService

  ) { }

  registerationChangeAction() {
    this.isEmailMode = !this.isEmailMode;
  }

  nextAction() {
    console.log('Contact:', this.contact);

    if (!this.isOTPMode) {
      this.http.post(this.chatService.Service_sendOTP, { contact: this.contact }).subscribe(() => {
        this.isOTPMode = true;
        alert('OTP sent to your contact! Please check your email or phone.');
      }, (err) => {
        if (err.status == 400 && err.error.message == 'User already registered') {
          alert('This contact is already registered. Please login instead.');
        } else {
          console.error('Error sending OTP:', err);
          alert('Error sending OTP. Please try again!');
        }
      });
    } else {
      this.http.post(this.chatService.Service_verifyOTP, { contact: this.contact, otp: this.otp }).subscribe(() => {
        alert('Verified successfully!');
        this.router.navigate(['/login']);
      }, () => {
        alert('Invalid OTP! Please try again.');
      });
    }
  }

  isValidMobileNumber(number: string): boolean {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidInput(): boolean {
    if (this.isOTPMode) {
      return this.otp.trim().length > 0;
    } else if (this.isEmailMode) {
      return this.contact.trim().length > 0 && this.isValidEmail(this.contact);
    } else {
      return this.contact.trim().length > 0 && this.isValidMobileNumber(this.contact);
    }
  }


  backAction() {
    this.isOTPMode = false;
  }

  resendOTP() {
    this.http.post(this.chatService.Service_sendOTP, { contact: this.contact }).subscribe(() => {
      alert('OTP has been resent. Please check your email or phone.');
    }, (err) => {
      console.error('Error resending OTP:', err);
      alert('Failed to resend OTP. Please try again!');
    });
  }


  backNavigationAction() {
    this.router.navigate(['/login']);
  }



}
