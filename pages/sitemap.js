import axios from 'axios';
import config from '../config';

function Sitemap({ urls }) {
  return (
    <div>
      <h1>Sitemap</h1>
      <ul>
        {urls.map((url, index) => (
          <li key={index}>
            <a href={url}>{url}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const res = await axios.get(config.API_URL, {
      headers: {
        Authorization: `Bearer ${config.API_TOKEN}`,
      },
    });

    const articles = res.data.data;
    const urls = articles
      .filter(article => article.attributes.Domain === config.HARDCODED_DOMAIN)
      .map(article => {
        const slug = article.attributes.urlSlug;
        // Ensure the slug starts with a '/'
        const formattedSlug = slug.startsWith('/') ? slug : `/${slug}`;
        return `https://${config.HARDCODED_DOMAIN}${formattedSlug}`;
      });

    // Ensure the home page is always first in the sitemap
    const homePageIndex = urls.findIndex(url => url.endsWith('/'));
    if (homePageIndex > 0) {
      const homePage = urls.splice(homePageIndex, 1)[0];
      urls.unshift(homePage);
    } else if (homePageIndex === -1) {
      // If no home page was found, add it
      urls.unshift(`https://${config.HARDCODED_DOMAIN}/`);
    }

    return {
      props: {
        urls,
      },
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        urls: [],
      },
    };
  }
}

export default Sitemap;