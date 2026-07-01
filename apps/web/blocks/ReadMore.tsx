import Image, { StaticImageData } from "next/image";
import React from "react";
import articlePreview from "../public/article-preview.png";

function ReadMore() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Read more
        </h3>
        <p className="text-center">Documentation and source code.</p>
        <div className="flex flex-col items-center justify-center gap-4 p-4 mt-4 sm:flex-row">
          <ArticleCard
            link="https://github.com/wende/treelocatorjs"
            imageSrc={articlePreview}
            title="TreeLocatorJS on GitHub"
            by="Source, docs, and issue tracker"
            description="Alt+click component discovery, browser automation API, MCP bridge, visual diff snapshots, and framework adapters."
          />
          <ArticleCard
            link="https://github.com/wende/treelocatorjs/blob/main/docs/BROWSER-API.md"
            imageSrc={articlePreview}
            title="Browser automation API"
            by="For Playwright, Puppeteer, and Cypress"
            description="Use window.__treelocator__ to read component ancestry, computed styles, CSS rules, and snapshot diffs from your tests."
          />
        </div>
      </div>
    </section>
  );
}

export default ReadMore;

function ArticleCard({
  link,
  imageSrc,
  title,
  by,
  description,
}: {
  link: string;
  imageSrc: string | StaticImageData;
  title: string;
  by: string;
  description: string;
}) {
  return (
    <a
      href={link}
      className="overflow-hidden transition-shadow shadow-xl bg-slate-50 xl:w-1/4 md:w-1/2 rounded-xl hover:shadow-2xl max-w-[400px]"
    >
      <Image
        className="object-cover object-center w-full h-40 mb-6 rounded"
        src={imageSrc}
        alt="content"
        width="400"
        height="200"
      />
      <div className="p-6 ">
        <h2 className="text-lg font-medium text-gray-900 underline title-font">
          {title}
        </h2>
        <h3 className="mb-4 text-xs font-medium text-gray-500">{by}</h3>
        <p className="text-base leading-relaxed">{description}</p>
      </div>
    </a>
  );
}
