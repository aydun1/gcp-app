import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Observable, tap } from 'rxjs';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { Address } from '../../../customers/shared/address';
import { Customer } from '../../../customers/shared/customer';
import { Site } from '../../../customers/shared/site';

@Component({
  selector: 'gcp-recycling-docket-dialog',
  templateUrl: './recycling-docket-dialog.component.html',
  styleUrls: ['./recycling-docket-dialog.component.css']
})
export class RecyclingDocketDialogComponent implements OnDestroy, OnInit {
  public quantities!: {Loscam: number, Chep: number, Plain: number}
  public address!: Address | undefined;
  public site!: Site | undefined;
  public date!: Date;
  public cages$!: Observable<Cage[]>;
  public cageTypes = {
    solid: [] as Array<number>,
    folding: [] as Array<number>,
    other: 0
  }

  constructor(
    public dialogRef: MatDialogRef<RecyclingDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, addresses: Array<Address>, sites: Array<Site>, site: string},
    private renderer: Renderer2,
    private router: Router,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.date = new Date();
    this.site = this.data.sites.find(_ => _.fields.Title === this.data.site);
    this.renderer.addClass(document.body, 'print-dialog');
    this.address = this.data.addresses.filter(_ => _.addresstypecode === 2)[0];
    this.cages$ = this.getCages(this.data.site);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print-dialog');
  }

  getCages(site: string): Observable<Cage[]> {
    this.cageTypes = {solid: [], folding: [], other: 0};
    return this.recyclingService.getActiveCustomerCages(this.data.customer.custNmbr, site, false).pipe(
      tap(_ => _.forEach(cage => {
        if (cage.fields.AssetTypeClean === 'Solid cage') this.cageTypes.solid.push(cage.fields.CageNumber);
        else if (cage.fields.AssetTypeClean === 'Folding cage') this.cageTypes.folding.push(cage.fields.CageNumber);
        else this.cageTypes.other += 1;
      }))
    );
  }

  print(): void {
    window.print();
  }

  setAddress(address: Address): void {
    this.address = address;
  }

  setSite(site: Site): void {
    this.site = site;
    this.cages$ = this.getCages(site.fields.Title);
    this.router.navigate([], { queryParams: {site: site.fields.Title}, queryParamsHandling: 'merge', replaceUrl: true});
  }
}
