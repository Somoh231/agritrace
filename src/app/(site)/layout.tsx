import RevealObserver from "@/components/site/RevealObserver";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import { siteFontVariables } from "@/lib/site/fonts";

/**
 * Public corporate site shell. Everything inside `.avs` uses the AgriVault
 * design system (src/styles/site.css, loaded from the root layout ahead of
 * Tailwind so utilities override it); application styles are untouched.
 * The inline script marks JS as available before first paint so scroll
 * reveals never flash content that is already on screen.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`avs ${siteFontVariables} min-h-full`}>
      <script
        // Static string, no interpolation.
        dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('avs-js')" }}
      />
      <a href="#main" className="avs-skip">
        Skip to content
      </a>
      <SiteNav />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <RevealObserver />
    </div>
  );
}
