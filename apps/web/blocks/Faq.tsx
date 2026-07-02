export default function Faq() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          FAQ
        </h3>
        <div className="max-w-2xl mx-auto mt-8 space-y-6 text-left">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Do I need to install anything in my project?
            </h4>
            <p className="mt-2">
              For most Vite and Next.js stacks, run{" "}
              <code className="px-1 py-0.5 bg-slate-100 rounded">npx @treelocator/init</code>{" "}
              once. You can also use the browser extension on local dev pages without changing your build.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Which frameworks are supported?
            </h4>
            <p className="mt-2">
              React, Vue, Svelte, Preact, Solid, Next.js, and Phoenix LiveView. See the{" "}
              <a
                href="https://github.com/wende/treelocatorjs#framework-support"
                className="text-indigo-500 hover:underline"
              >
                full list
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
