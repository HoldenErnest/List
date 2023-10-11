import { Component } from '@angular/core';

let someWord = "<placeholder words>";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  title = 'ListApp';
  name = someWord;
}
