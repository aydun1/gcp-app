import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'gcp-sds-list',
  templateUrl: './sds-list.component.html',
  styleUrls: ['./sds-list.component.css']
})
export class SdsListComponent implements OnInit {

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    1
  }

  login() {
    this.http.get(`${environment.cwEndpoint}/login`).subscribe();
  }

  materials() {
    this.http.get(`${environment.cwEndpoint}/materials`).subscribe();
  }
}
