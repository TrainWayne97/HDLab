import { useCallback, useEffect, useState } from 'react';
import { COURSES } from '../config/courses';

export const EDITOR_PATH = '/Editor';
export const TUTORIAL_PATH = '/Tutorial';
export const coursePath = courseId => `/Lehre/${courseId}`;
// Last path segment of a tutorial/course URL that shows the overview instead of a lesson.
export const OVERVIEW = 'Uebersicht';

const EDITOR_ROUTE = { page: 'home', courseId: null, lesson: null };

// Segment after the tutorial/course path: a lesson id ("7"), OVERVIEW or null if missing/invalid.
function parseLesson(segment) {
  if (/^\d+$/.test(segment || '')) return String(parseInt(segment, 10));
  return segment === OVERVIEW.toLowerCase() ? OVERVIEW : null;
}

// Path -> { page: 'home' | 'tutorial' | 'course', courseId, lesson }; null for paths that are not a page.
function parsePath(pathname) {
  const parts = pathname.toLowerCase().split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'editor') return EDITOR_ROUTE;
  if (parts.length <= 2 && parts[0] === 'tutorial') {
    return { page: 'tutorial', courseId: null, lesson: parseLesson(parts[1]) };
  }
  if (parts.length >= 2 && parts.length <= 3 && parts[0] === 'lehre') {
    const course = COURSES.find(c => c.id.toLowerCase() === parts[1]);
    if (course) return { page: 'course', courseId: course.id, lesson: parseLesson(parts[2]) };
  }
  return null;
}

function canonicalPath(route) {
  if (route.page === 'home') return EDITOR_PATH;
  const base = route.page === 'course' ? coursePath(route.courseId) : TUTORIAL_PATH;
  return route.lesson ? `${base}/${route.lesson}` : base;
}

/**
 * Current page, kept in sync with the browser URL so that back/forward, reload and links work.
 * Returns [route, navigate] - navigate(path) adds a history entry, navigate(path, { replace: true })
 * rewrites the current one.
 */
export default function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const route = parsePath(pathname) || EDITOR_ROUTE;
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

  const navigate = useCallback((path, { replace = false } = {}) => {
    if (path !== window.location.pathname) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
    }
    setPathname(path);
  }, []);

  return [route, navigate];
}
