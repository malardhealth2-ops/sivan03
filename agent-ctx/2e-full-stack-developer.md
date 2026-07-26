# Task 2e - Blog Section Dynamic Fetch + Modal

## Files Created
- src/components/sivan/BlogPostModal.tsx

## Files Modified
- src/components/sivan/BlogPreview.tsx

## Summary
- Blog section fetches from /api/blog?status=published&limit=6
- 3 skeleton cards while loading, falls back to static posts on error/empty
- BlogPostModal renders full post (API or static) with justified Persian HTML
- Lint clean, zero errors
