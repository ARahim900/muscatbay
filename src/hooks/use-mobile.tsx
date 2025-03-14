
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Initial check for mobile state
    const checkMobile = () => window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(checkMobile())
    
    // Set up a more efficient event listener with debounce
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsMobile(checkMobile());
      }, 100);
    };
    
    // Create media query for more responsive updates
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    // Add both event listeners for better compatibility
    window.addEventListener("resize", handleResize)
    
    // Modern browsers
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener("change", handleMediaChange)
    } 
    // Safari < 14
    else if (typeof mql.addListener === 'function') {
      mql.addListener(handleMediaChange)
    }
    
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer);
      
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener("change", handleMediaChange)
      } 
      else if (typeof mql.removeListener === 'function') {
        mql.removeListener(handleMediaChange)
      }
    }
  }, [])

  return isMobile
}
