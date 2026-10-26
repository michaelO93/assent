/** Only same-site relative paths, so consent redirects can't be used as an open redirect. */
export function safeReturnPath(path: string | null | undefined): string | null {
  return path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : null;
}
