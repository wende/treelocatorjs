import "../styles/globals.css";
import setupLocatorUI from "@treelocator/runtime";
import Head from "next/head";
import { useEffect } from "react";

const branchName = process.env.VERCEL_GIT_COMMIT_REF || "main";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Setup TreeLocatorJS only on the client side to avoid hydration issues
    setupLocatorUI(
      process.env.NODE_ENV === "production"
        ? {
            adapter: "jsx",
            targets: {
              github: {
                label: "GitHub",
                url: `https://www.github.com/wende/treelocatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
              },
              githubDevEditor: {
                label: "GitHub.dev Editor",
                url: `https://github.dev/wende/treelocatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
              },
            },
          }
        : {
            adapter: "jsx",
          }
    );
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <title>TreeLocatorJS - Alt+click to copy component ancestry</title>
        <meta
          name="description"
          content="Alt+click any UI element to copy its complete component hierarchy to your clipboard."
        ></meta>
        <meta property="og:image" content="/preview.png"></meta>
        <meta name="twitter:card" content="summary_large_image"></meta>
        <meta
          name="twitter:title"
          content="TreeLocatorJS - Alt+click to copy component ancestry"
        ></meta>
        <meta name="twitter:image" content="/preview.png"></meta>
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_gnU0ViluJLtfnpxuoncJBPmPaysPfNSmA8jpVCpUHwa',{api_host:'https://app.posthog.com'})`,
            }}
          />
        )}
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
