import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({providedIn:'root'})
export class ApiService {
  private base=environment.apiUrl;
  constructor(private http:HttpClient){}
  get(path:string,params:any={}){return this.http.get<any>(`${this.base}${path}`,{params});}
  post(path:string,body:any){return this.http.post<any>(`${this.base}${path}`,body);}
  put(path:string,body:any){return this.http.put<any>(`${this.base}${path}`,body);}
  patch(path:string,body:any){return this.http.patch<any>(`${this.base}${path}`,body);}
  delete(path:string){return this.http.delete<any>(`${this.base}${path}`);}
  download(path:string,params:any={}){return this.http.get(`${this.base}${path}`,{params,responseType:'blob'});}
}
