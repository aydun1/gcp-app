import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { NavigationService } from '../../navigation.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { PanListComponent } from '../../pan-list/pan-list/pan-list.component';

@Component({
  selector: 'gcp-loading-schedule-pan',
  templateUrl: './loading-schedule-pan.component.html',
  styleUrls: ['./loading-schedule-pan.component.css'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatToolbarModule, PanListComponent]
})
export class LoadingSchedulePanComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private scheduleId = this.route.snapshot.paramMap.get('id') || '';
  private panListId = this.route.snapshot.queryParamMap.get('pan') || '';

  public notes!: string;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit(): void {
    const panListDetails = this.loadingScheduleService.panLists?.find(_ => _[0] === this.panListId);
    this.notes = panListDetails ? panListDetails[1].replace(/&#44;/g, ',').replace(/<br>/g, '\r\n') : '';
  }

  updateNote(note: string | null): void {
    this.loadingScheduleService.addPanNote(this.scheduleId, this.panListId, note);
  }

  goBack(): void {
    this.navService.back();
  }

}
