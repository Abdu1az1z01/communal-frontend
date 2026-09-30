import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incident } from './incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/incidents';

  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(this.apiUrl);
  }
}