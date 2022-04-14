import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedService } from '../../../shared.service';
import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-branch-button',
  templateUrl: './branch-button.component.html',
  styleUrls: ['./branch-button.component.css']
})
export class BranchButtonComponent implements OnInit {

  @Input() cage: Cage;
  @Output() updated = new EventEmitter<boolean>();
  public branches: Array<string>;
  public loading: boolean;

  constructor(
    private sharedService: SharedService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.branches = this.sharedService.branches;
  }

  setBranch(cage: Cage, branch: string) {
    this.loading = true;
    this.recyclingService.setBranch(cage.id, branch).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }
}
