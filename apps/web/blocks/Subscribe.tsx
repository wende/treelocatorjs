import React from "react";

export default function Subscribe() {
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full text-center">
          <h2 className="mb-4 text-2xl font-medium text-gray-900 font-display sm:text-5xl title-font dark:text-white">
            Stay in the loop
          </h2>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3">
            Watch the repository for releases and follow discussions.
          </p>
          <div className="flex items-center justify-center gap-4 my-8">
            <a
              href="https://github.com/wende/treelocatorjs"
              className="flex bg-gray-900 border-0 text-white py-3 px-8 focus:outline-none hover:bg-gray-800 rounded-full text-lg items-center gap-2 shadow-xl"
            >
              View on GitHub
            </a>
            <a
              href="https://github.com/wende/treelocatorjs/discussions"
              className="flex bg-white border border-gray-300 text-gray-800 py-3 px-8 focus:outline-none hover:bg-gray-50 rounded-full text-lg items-center gap-2 shadow-xl"
            >
              Discussions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
