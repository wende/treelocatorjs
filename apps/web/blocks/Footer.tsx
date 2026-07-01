import Image from "next/image";
import Link from "next/link";
import React from "react";
import logo from "../public/logo-noborders3x.png";

function Footer() {
  return (
    <footer className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container flex flex-col items-center px-5 py-8 mx-auto sm:flex-row rounded-t-3xl bg-slate-100">
        <Link href="/">
          <Image
            unoptimized={true}
            src={logo}
            height={50}
            width={207}
            alt="TreeLocatorJS logo"
          />
        </Link>
        <p className="mt-4 text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 dark:text-gray-400 dark:sm:border-gray-800">
          © {new Date().getFullYear()} TreeLocatorJS
        </p>
        <span className="inline-flex justify-center mt-4 sm:ml-auto sm:mt-0 sm:justify-start">
          <a
            href="https://github.com/wende/treelocatorjs"
            title="GitHub"
            className="ml-3 text-gray-500 dark:text-gray-400"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
