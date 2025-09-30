// imports
import axios from 'axios';
import Head from 'next/head';
import config from '../config';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';
import Link from 'next/link';

// Function to process Markdown content
async function processMarkdown(content) {
  let unescapedContent = content.replace(/\\n/g, '\n');
  unescapedContent = unescapedContent.replace(/^(#{1,6})/gm, '$1 ');

  const processedContent = await remark()
    .use(gfm)
    .use(html)
    .process(unescapedContent);

  return processedContent.toString();
}

// Function to parse styles
function parseStyles(styles) {
  if (typeof styles === 'string') {
    try {
      return JSON.parse(styles);
    } catch (error) {
      console.error('Error parsing styles string:', error);
      return {};
    }
  } else if (typeof styles === 'object' && styles !== null) {
    return styles;
  } else {
    console.error('Invalid styles format:', styles);
    return {};
  }
}

// Function to fetch image data from Unsplash
async function fetchImageData(keywords) {
  const accessKey = config.UNSPLASH_ACCESS_KEY;
  const query = encodeURIComponent(keywords.replace(/,/g, ' '));
  const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${accessKey}&per_page=1`;

  try {
    const res = await axios.get(url);
    const results = res.data.results;
    if (results.length > 0) {
      const photo = results[0];
      const imageUrl = photo.urls.regular;
      const photographerName = photo.user.name;
      const photographerProfileUrl = photo.user.links.html;
      return { imageUrl, photographerName, photographerProfileUrl };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return null;
  }
}

// Main component
export default function HomePage({ homeArticle, otherArticles }) {
  if (!homeArticle) return <div>Home page content not found</div>;

  const { attributes } = homeArticle;

  const containerStyles = parseStyles(attributes.containerStyles);
  const headerStyles = parseStyles(attributes.headerStyles);
  const bodyStyles = parseStyles(attributes.bodyStyles);
  const paragraphStyles = parseStyles(attributes.paragraphStyles);

  return (
    <div className="container" style={containerStyles}>
      <Head>
        <title>{attributes.MetaTitle}</title>
        <meta name="description" content={attributes.MetaDescription} />
        <link rel="canonical"     href={`https://${attributes.CanonicalURL.includes(attributes.urlSlug) 
      ? attributes.CanonicalURL 
      : `${attributes.CanonicalURL.replace(/\/$/, '')}/${attributes.urlSlug?.replace(/^\/+|\/+$/g, '')}`
    }`} />
        {attributes.Schema && (
          <script type="application/ld+json">{JSON.stringify(attributes.Schema)}</script>
        )}
      </Head>

      <header className="header" style={headerStyles}>
        <h2>{attributes.H1}</h2>
        <h3>{attributes.Title}</h3>
        {attributes.imageUrl && (
          <div>
            <img src={attributes.imageUrl} alt={attributes.Title} />
          </div>
        )}
      </header>

      <main className="content" style={bodyStyles}>
        <p style={paragraphStyles}>{attributes.Paragraph}</p>
        {attributes.ProcessedMarkdown && (
          <div dangerouslySetInnerHTML={{ __html: attributes.ProcessedMarkdown }} />
        )}
      </main>

      <section className="article-selection">
  <div className="article-grid">
    {otherArticles.map((article) => (
      <Link href={article.attributes.urlSlug} key={article.id}>
        <a className="article-card">
          {article.attributes.imageUrl && (
            <div className="image-container">
              <img src={article.attributes.imageUrl} alt={article.attributes.Title} width={"650px"} className="artimg" />
            </div>
          )}
          <h3>{article.attributes.Title}</h3>
          <p>{article.attributes.Paragraph.substring(0, 100)}...</p>
        </a>
      </Link>
    ))}
  </div>
</section>
    </div>
  );
}

// getStaticProps function
export async function getStaticProps() {
  try {
    const res = await axios.get(config.API_URL, {
      headers: {
        Authorization: `Bearer ${config.API_TOKEN}`,
      },
    });
    const allArticles = res.data.data;
    const homeArticle = allArticles.find(
      (article) =>
        article.attributes.Domain === config.HARDCODED_DOMAIN &&
        article.attributes.urlSlug === '/'
    );

    const otherArticles = allArticles.filter(
      (article) =>
        article.attributes.Domain === config.HARDCODED_DOMAIN &&
        article.attributes.urlSlug !== '/'
    );

    if (!homeArticle) {
      return { notFound: true };
    }

    if (homeArticle.attributes.Markdown) {
      homeArticle.attributes.ProcessedMarkdown = await processMarkdown(
        homeArticle.attributes.Markdown
      );
    }

    // Fetch image data for the homeArticle
    if (homeArticle.attributes.imgkeywords) {
      const imageData = await fetchImageData(homeArticle.attributes.imgkeywords);
      if (imageData) {
        homeArticle.attributes.imageUrl = imageData.imageUrl;
        homeArticle.attributes.photographerName = imageData.photographerName;
        homeArticle.attributes.photographerProfileUrl = imageData.photographerProfileUrl;
      }
    }

    // Fetch image data for otherArticles
    await Promise.all(
      otherArticles.map(async (article) => {
        if (article.attributes.imgkeywords) {
          const imageData = await fetchImageData(article.attributes.imgkeywords);
          if (imageData) {
            article.attributes.imageUrl = imageData.imageUrl;
            article.attributes.photographerName = imageData.photographerName;
            article.attributes.photographerProfileUrl = imageData.photographerProfileUrl;
          }
        }
      })
    );

    return {
      props: {
        homeArticle,
        otherArticles,
      },
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}
