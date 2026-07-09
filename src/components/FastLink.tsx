"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

const tap =
  "touch-manipulation select-none active:scale-[0.98] active:brightness-95 transition-[transform,filter,background-color,border-color,color] duration-75";

type FastLinkProps = ComponentProps<typeof Link>;

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ block: "start" });
  window.history.pushState(null, "", `#${id}`);
}

function handleHashNav(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  onClick?: FastLinkProps["onClick"],
) {
  onClick?.(e);
  if (e.defaultPrevented) return;

  const url = new URL(href, window.location.origin);
  const samePage =
    url.pathname === window.location.pathname ||
    (url.pathname === "/" && window.location.pathname === "/");

  if (samePage && url.hash) {
    e.preventDefault();
    scrollToHash(url.hash);
  }
}

export function FastLink({
  href,
  onClick,
  className = "",
  prefetch = true,
  ...rest
}: FastLinkProps) {
  const hrefStr = typeof href === "string" ? href : "";

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={(e) => {
        if (hrefStr.includes("#")) {
          handleHashNav(e, hrefStr, onClick);
        } else {
          onClick?.(e);
        }
      }}
      className={`${tap} ${className}`.trim()}
      {...rest}
    />
  );
}

export function fastButtonClass(className = "") {
  return `${tap} ${className}`.trim();
}
