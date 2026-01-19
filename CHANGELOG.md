## Changelog

### 2026-01-13
- Tightened main content container spacing for consistent left/right gutters next to the sidebar.
- Further reduced container padding and increased max width so dashboard cards sit closer to the sidebar while keeping balanced gutters.
- Introduced mobile-first layout shell with clamp-based gutters, removed fixed max width from main content, and made stat grid auto-fit to fill available space on any screen size.
- Removed search box from sidebar navigation bar.
- Fixed content sizing to fully fill screen width by reducing layout-shell padding to minimal values (clamp(8px, 2vw, 24px)) and removing extra padding from page components.
- Updated stats grid to use w-full and reduced minimum card width from 220px to 200px for better space utilization.
 - Further biased layout-shell padding to the right (smaller left padding, slightly larger right padding) so dashboard content visually shifts closer to the sidebar while still keeping a comfortable right gutter on wide screens.