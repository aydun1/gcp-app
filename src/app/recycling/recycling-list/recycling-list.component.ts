import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Cage } from '../shared/cage';
import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'app-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  public cages$: Observable<Cage[]>;
  public nameFilter = new FormControl('');
  public territoryFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public territories$: Observable<any[]>;
  private _loadList: boolean;

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private recyclingService: RecyclingService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.cages$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      ).pipe(map(s => _))),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : [])
    )
  }

  getFirstPage(_: any) {
    return this.recyclingService.getFirstPage(_);
  }

  getNextPage() {
    return this.recyclingService.getNextPage();
  }

  parseParams(params: Params) {
    if (!params) return;
    const filters: any = {};
    if ('territory' in params) {
      this.territoryFilter.patchValue(params['territory']);
      filters['territory'] = params['territory'];
    } else {
      this.territoryFilter.patchValue('');
    }

    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
      filters['name'] = params['name'];
    } else {
      if (this.nameFilter.value) this.nameFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params) {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameName = prev['name'] === curr['name'];
    const sameTerritory = prev['territory'] === curr['territory'];
    return sameName && sameTerritory && this._loadList;
  }

  setRegion(e: any) {

  }

  clearNameFilter() {

  }
}
