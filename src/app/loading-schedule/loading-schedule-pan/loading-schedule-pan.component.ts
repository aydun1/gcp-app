import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NavigationService } from '../../navigation.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';

@Component({
  selector: 'gcp-loading-schedule-pan',
  templateUrl: './loading-schedule-pan.component.html',
  styleUrls: ['./loading-schedule-pan.component.css']
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
    this.notes = panListDetails ? panListDetails[1].replace(/<br>/g, '\r\n') : '';
  }

  updateNote(note: string | null): void {
    this.loadingScheduleService.addPanNote(this.scheduleId, this.panListId, note);
  }

  goBack(): void {
    this.navService.back();
  }

}
