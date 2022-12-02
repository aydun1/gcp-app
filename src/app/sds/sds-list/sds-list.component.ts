import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';

import { SharedService } from '../../shared.service';
import { Chemical } from '../chemical';
import { SdsService } from '../sds.service';

@Component({
  selector: 'gcp-sds-list',
  templateUrl: './sds-list.component.html',
  styleUrls: ['./sds-list.component.css']
})
export class SdsListComponent implements OnInit {
  private ownState = this.shared.branch;

  public loading = false;
  public displayedColumns = ['bin', 'product', 'onHand'];
  public chemicals$!: Promise<Chemical[]>;
  public branchFilter = new FormControl({value: this.ownState, disabled: false});
  public states = this.shared.branches;

  constructor(
    private router: Router,
    private shared: SharedService,
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    this.getChemicals();
  }

  getChemicals() {
    this.chemicals$ = this.sdsService.getChemicals('QLD').then(_ => {console.log(_); return _})
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  trackByFn(index: number, item: Chemical): string {
    return item.ItemNmbr;
  }

}
