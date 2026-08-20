import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private lastSnapshot: RouterStateSnapshot | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => {
      if (this.lastSnapshot) this.updateTitle(this.lastSnapshot);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastSnapshot = snapshot;
    let route = snapshot.root;
    let titleKey: string | undefined;

    while (route) {
      titleKey = route.data['titleKey'] ?? titleKey;
      route = route.children.find((child) => child.outlet === 'primary')!;
    }

    if (titleKey) this.title.setTitle(this.translate.instant(titleKey));
  }
}
