import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataStorageService } from 'src/app/service/data-storage.service';

@Component({
  selector: 'top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.scss']
})
export class TopToolbarComponent {

  constructor(
    private router: Router,
    protected dataService: DataStorageService) {
  }
  readonly trigger_name = this.router.url.split('/')[1];
  public showSelectButtonsModal = false;
}
