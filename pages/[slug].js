import axios from 'axios';
import Head from 'next/head';
import config from '../config';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';

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
const constructCanonicalUrl = () => {
  const baseUrl = attributes.CanonicalURL?.trim() || '';
  const slug = attributes.urlSlug?.trim() || '';
  
  // Remove trailing slash from base URL if it exists
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Remove leading and trailing slashes from slug
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  
  // Check if the base URL already contains the slug
  if (cleanBaseUrl.endsWith(cleanSlug)) {
    return cleanBaseUrl;
  }
  
  // Combine parts with a single slash
  return cleanBaseUrl && cleanSlug
    ? `https://${cleanBaseUrl}/${cleanSlug}`
    : `https://${cleanBaseUrl}`;
};
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

export default function ArticlePage({ article }) {
  if (!article) return <div>Article not found</div>;

  const { attributes } = article;

  const containerStyles = parseStyles(attributes.containerStyles);
  const headerStyles = parseStyles(attributes.headerStyles);
  const bodyStyles = parseStyles(attributes.bodyStyles);
  const paragraphStyles = parseStyles(attributes.paragraphStyles);

  return (
    <div className="container" style={containerStyles}>
      <Head>
        <title>{attributes.MetaTitle || attributes.Title}</title>
        <meta name="description" content={attributes.MetaDescription} />
        {attributes.CanonicalURL && (
          <link
            rel="canonical"
            href={`https://${attributes.CanonicalURL.includes(attributes.urlSlug) 
              ? attributes.CanonicalURL 
              : `${attributes.CanonicalURL.replace(/\/$/, '')}/${attributes.urlSlug?.replace(/^\/+|\/+$/g, '')}`
            }`}
          />
        )}
        {attributes.Schema && (
          <script type="application/ld+json">
            {JSON.stringify(attributes.Schema)}
          </script>
        )}
      </Head>

      <header className="header" style={headerStyles}>
        <h1>{attributes.H1 || attributes.Title}</h1>
        {attributes.Title !== attributes.H1 && <h2>{attributes.Title}</h2>}
        {attributes.imageUrl && (
          <div className="image-container">
            <img src={attributes.imageUrl} alt={attributes.Title} width={"650px"} className="artimg" />
          </div>
        )}
      </header>

      <main className="content" style={bodyStyles}>
        <p style={paragraphStyles}>{attributes.Paragraph}</p>
        {attributes.ProcessedMarkdown && (
          <div dangerouslySetInnerHTML={{ __html: attributes.ProcessedMarkdown }} />
        )}
      </main>
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const res = await axios.get(config.API_URL, {
      headers: {
        Authorization: `Bearer ${config.API_TOKEN}`,
      },
    });

    const articles = res.data.data;
    const paths = articles
      .filter(
        (article) =>
          article.attributes.Domain === config.HARDCODED_DOMAIN &&
          article.attributes.urlSlug !== '/'
      )
      .map((article) => ({
        params: { slug: article.attributes.urlSlug.replace(/^\//, '') },
      }));

    return { paths, fallback: false };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }) {
  try {
    const res = await axios.get(config.API_URL, {
      headers: {
        Authorization: `Bearer ${config.API_TOKEN}`,
      },
    });
    const allArticles = res.data.data;
    const article = allArticles.find(
      (article) =>
        article.attributes.Domain === config.HARDCODED_DOMAIN &&
        article.attributes.urlSlug.replace(/^\//, '') === params.slug
    );

    if (!article) {
      return { notFound: true };
    }

    // Process Markdown content
    if (article.attributes.Markdown) {
      article.attributes.ProcessedMarkdown = await processMarkdown(
        article.attributes.Markdown
      );
    }

    // Fetch image data for the article
    if (article.attributes.imgkeywords) {
      const imageData = await fetchImageData(article.attributes.imgkeywords);
      if (imageData) {
        article.attributes.imageUrl = imageData.imageUrl;
        article.attributes.photographerName = imageData.photographerName;
        article.attributes.photographerProfileUrl = imageData.photographerProfileUrl;
      }
    }

    return {
      props: {
        article,
      },
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}
