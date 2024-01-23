export class LocalStorageService {
  public get(key: string): string | null {
    return localStorage.getItem(key);
  }

  public set(key: string, value: string) {
    return localStorage.setItem(key, value);
  }

  public unset(key: string) {
    return localStorage.removeItem(key);
  }
}
