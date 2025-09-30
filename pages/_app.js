import axios from 'axios';
import App from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import '../styles/globals.css';
import config from '../config';

const Header = ({ siteName, menuItems }) => (
  <header className="app-header">
    <h1><a href="/">{siteName}</a></h1>
    <nav>
      {Object.entries(menuItems).map(([name, url]) => (
        <Link href={url} key={name}>
          <a className="nav-link">{name}</a>
        </Link>
      ))}
    </nav>
  </header>
);

const Footer = ({ siteName }) => (
  <footer className="app-footer">
    <div className="SiteMap">
      <p><a href="/sitemap">sitemap</a></p>
    </div>
    <p>Copyright © {new Date().getFullYear()} {siteName}. All rights reserved.</p>
  </footer>
);

// helper to turn { ".class": { prop: val, ... }, ... } into raw CSS
function cssObjectToString(cssObj = {}) {
  try {
    return Object.entries(cssObj)
      .map(([selector, rules]) => {
        const body = Object.entries(rules)
          .map(([prop, val]) => `${prop}: ${val};`)
          .join(' ');
        return `${selector} { ${body} }`;
      })
      .join(' ');
  } catch {
    return '';
  }
}

class MyApp extends App {
  static async getInitialProps(appContext) {
    const appProps = await App.getInitialProps(appContext);

    const domain =
      process.env.NEXT_PUBLIC_HARDCODED_DOMAIN || config.HARDCODED_DOMAIN;

    let domainStyles = '';
    let siteName = 'Default Site Name';
    let menuItems = {};

    try {
      // ---------- Styles (DomainStyleV2) ----------
      const stylesURL = `${process.env.STRAPI_STYLING}?filters[domain][$eq]=${encodeURIComponent(
        domain
      )}`;

      const styleRes = await axios.get(stylesURL, {
        headers: { Authorization: `Bearer ${config.API_TOKEN}` },
      });

      const styleJSON =
        styleRes?.data?.data?.[0]?.attributes?.style || {};

      domainStyles = cssObjectToString(styleJSON);

      // ---------- Site Name (from Articles) ----------
      const articlesRes = await axios.get(
        process.env.STRAPI_API_URL || config.API_URL,
        { headers: { Authorization: `Bearer ${config.API_TOKEN}` } }
      );

      const articles = articlesRes?.data?.data || [];
      const home = articles.find(
        (a) =>
          a?.attributes?.Domain === domain &&
          a?.attributes?.urlSlug === '/'
      );
      if (home?.attributes?.SiteName) {
        siteName = home.attributes.SiteName;
      }

      // ---------- Menu (Menu2) ----------
      const menuURL = `${process.env.STRAPI_MENU_API}?filters[domain][$eq]=${encodeURIComponent(
        domain
      )}`;

      const menuRes = await axios.get(menuURL, {
        headers: { Authorization: `Bearer ${config.API_TOKEN}` },
      });

      const m = menuRes?.data?.data?.[0]?.attributes || {};

      // Build the object { anchor: url } that Header expects
      const tmp = {};
      if (m.link1anchor && m.link1url) tmp[m.link1anchor] = m.link1url;
      if (m.link2anchor && m.link2url) tmp[m.link2anchor] = m.link2url;
      if (m.link3anchor && m.link3url) tmp[m.link3anchor] = m.link3url;

      // sensible fallback
      menuItems = Object.keys(tmp).length
        ? tmp
        : { Home: '/', Cleaning: '/natural-cleaning-solutions', Skincare: '/organic-skincare-essentials' };
    } catch (err) {
      console.error('Failed to fetch global data:', err?.response?.data || err?.message || err);
      // minimal fallbacks so build never crashes
      domainStyles ||= '';
      menuItems ||= { Home: '/' };
    }

    return { ...appProps, domainStyles, siteName, menuItems };
  }

  render() {
    const { Component, pageProps, domainStyles, siteName, menuItems } = this.props;
    return (
      <>
        <Head>
          <style>{domainStyles}</style>
        </Head>
        <Header siteName={siteName} menuItems={menuItems} />
        <main style={{ paddingBottom: '120px' }}>
          <Component {...pageProps} />
        </main>
        <Footer siteName={siteName} />
      </>
    );
  }
}

export default MyApp;
