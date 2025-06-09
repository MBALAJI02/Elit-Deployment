import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public socket_connection = 'http://localhost:4000'
}
