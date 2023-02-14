import { h, Component } from 'preact';

export default class SocialLinkList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: null,
    };
  }

  getIcon(iconType) {
    switch (iconType) {
      case 'website':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        );
      case 'instagram':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        );
      case 'youtube':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
          </svg>
        );
      case 'telegram':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        );
      case 'twitter':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
          </svg>
        );
      case 'tiktok':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <clipPath id="a">
                <path d="M0 0h24v24H0z" />
              </clipPath>
            </defs>
            <g clip-path="url(#a)">
              <path
                d="M18.148 6.011A4.793 4.793 0 0115.956 2h-3.457l-.007 13.782a2.9 2.9 0 01-4.247 2.451 2.888 2.888 0 01-1.558-2.558 2.903 2.903 0 012.908-2.892c.298 0 .587.05.856.134v-3.51a6.583 6.583 0 00-.856-.063c-3.509 0-6.362 2.838-6.362 6.328a6.316 6.316 0 002.716 5.183A6.35 6.35 0 009.595 22c3.508 0 6.361-2.839 6.361-6.328v-6.99a8.254 8.254 0 004.811 1.54V6.785a4.834 4.834 0 01-2.619-.774z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </g>
          </svg>
        );
      default:
        return null;
    }
  }

  getSocialLinkTitle(iconType, title) {
    switch (iconType) {
      case 'facebook':
        return `Facebook: ${title}`;
      case 'twitter':
        return `Twitter: ${title}`;
      case 'instagram':
        return `Instagram: ${title}`;
      case 'youtube':
        return `YouTube: ${title}`;
      case 'tiktok':
        return `TikTok: ${title}`;
      case 'telegram':
        return `Telegram: ${title}`;
    }
  }

  render({ items, websiteUrl, horizontal }, {}) {
    if (!items && !websiteUrl) {
      return null;
    }
    if (!items) {
      items = [];
    }
    return (
      <ul class={'social-list' + (horizontal ? ' social-list--horizontal' : ' social-list--page')}>
        {websiteUrl ? (
          <li class={'social-list__item'}>
            <a href={websiteUrl} class="social-link social-link--website" rel="noopener" target="_blank">
              {this.getIcon('website')}
              <span>{websiteUrl.replace('https://', '')}</span>
            </a>
          </li>
        ) : null}
        {items.map((socialLinkItem) => (
          <li class={'social-list__item'}>
            <a
              href={socialLinkItem.url}
              rel="noopener"
              target="_blank"
              title={this.getSocialLinkTitle(socialLinkItem.type, socialLinkItem.title)}
              class={`social-link social-link--${socialLinkItem.type}`}
            >
              {this.getIcon(socialLinkItem.type)}
              <span class="is-hidden">{socialLinkItem.title}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
}
