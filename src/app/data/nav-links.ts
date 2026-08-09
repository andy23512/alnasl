import { NavLink } from '../models/nav-link.models';

export const NAV_LINKS: NavLink[] = [
  {
    title: 'nav.page.home.title',
    routerLink: '/',
    routerLinkActiveOptions: { exact: true },
    ariaLabel: 'nav.page.home.aria-label',
    tooltipMessage: 'nav.page.home.tooltip',
    icon: 'home',
  },
  {
    title: 'nav.page.practice.title',
    routerLink: '/practice',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.practice.aria-label',
    tooltipMessage: 'nav.page.practice.tooltip',
    icon: 'my_location',
  },
  {
    title: 'nav.page.statistics.title',
    routerLink: '/statistics',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.statistics.aria-label',
    tooltipMessage: 'nav.page.statistics.tooltip',
    icon: 'trending_up',
  },
  {
    title: 'nav.page.settings.title',
    routerLink: '/settings',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.settings.aria-label',
    tooltipMessage: 'nav.page.settings.tooltip',
    icon: 'settings',
  },
  {
    title: 'nav.page.information.title',
    routerLink: '/information',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.information.aria-label',
    tooltipMessage: 'nav.page.information.tooltip',
    icon: 'info',
  },
];
