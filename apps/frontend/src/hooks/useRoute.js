import { useCallback, useEffect, useState } from 'react';
import { COURSES } from '../config/courses';

export const EDITOR_PATH = '/Editor';
export const TUTORIAL_PATH = '/Tutorial';
export const coursePath = courseId => `/Lehre/${courseId}`;

// Path -> { page: 'home' | 'tutorial' | 'course', courseId }; null for paths that are not a page.
function parsePath(pathname) {
  const parts = pathname.toLowerCase().split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'editor') return { page: 'home', courseId: null };
  if (parts.length === 1 && parts[0] === 'tutorial') return { page: 'tutorial', courseId: null };
  if (parts.length === 2 && parts[0] === 'lehre') {
    const course = COURSES.find(c => c.id.toLowerCase() === parts[1]);
    if (course) return { page: 'course', courseId: course.id };
  }
  return null;
}

const canonicalPath = route =>
  route.page === 'tutorial' ? TUTORIAL_PATH : route.page === 'course' ? coursePath(route.courseId) : EDITOR_PATH;

/**
 * Current page, kept in sync with the browser URL so that back/forward, reload and links work.
 * Returns [route, navigate] - navigate(path) adds a history entry.
 */
export default function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const route = parsePath(pathname) || { page: 'home', courseId: null };
  const canonical = canonicalPath(route);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // "/", unknown paths and other spellings are rewritten without adding a history entry.
  useEffect(() => {
    if (window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical + window.location.search + window.location.hash);
    }
  }, [canonical, pathname]);

  const navigate = useCallback(path => {
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
    }
    setPathname(path);
  }, []);

  return [route, navigate];
}
