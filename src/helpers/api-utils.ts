import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { AxiosError } from 'axios';

@Injectable()
export class HttpFetcherService {
  private readonly logger = new Logger(HttpFetcherService.name);

  constructor(private readonly http: HttpService) {}

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    retryCount = 0,
  ): Promise<T> {
    const obs = this.http[method]<T>(url, data).pipe(
      retry(retryCount),
      map(res => res.data),
      catchError((err: AxiosError) => {
        this.logger.error(`${method.toUpperCase()} ${url} failed: ${err.message}`);
        return throwError(() => new Error(`Failed ${method.toUpperCase()} ${url}`));
      }),
    );
    return firstValueFrom(obs);
  }

  fetchGet<T = any>(url: string, retryCount = 0): Promise<T> {
    return this.request('get', url, undefined, retryCount);
  }

  fetchPost<T = any>(url: string, body: any, retryCount = 0): Promise<T> {
    return this.request('post', url, body, retryCount);
  }

  fetchPut<T = any>(url: string, body: any, retryCount = 0): Promise<T> {
    return this.request('put', url, body, retryCount);
  }

  fetchPatch<T = any>(url: string, body: any, retryCount = 0): Promise<T> {
    return this.request('patch', url, body, retryCount);
  }

  fetchDelete<T = any>(url: string, retryCount = 0): Promise<T> {
    return this.request('delete', url, undefined, retryCount);
  }
}