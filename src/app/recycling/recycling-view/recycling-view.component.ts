import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RecyclingService } from '../shared/recycling.service';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-recycling-view',
  templateUrl: './recycling-view.component.html',
  styleUrls: ['./recycling-view.component.css']
})
export class RecyclingViewComponent implements OnInit {
  private id: string;
  public cage$: Observable<any>;
  public cageHistory$: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cage$ = this.getCage();
  }

  getCage() {
    this.id = this.route.snapshot.paramMap.get('id');
    return this.recyclingService.getCage(this.id).pipe(
      tap((_: any) => this.getCageHistory(_.fields.BinNumber2))
    );
  }

  getCageHistory(bin: number) {
    this.cageHistory$ = this.recyclingService.getCageHistory(bin);
  }

  goBack() {
    this.location.back();
  }
}
