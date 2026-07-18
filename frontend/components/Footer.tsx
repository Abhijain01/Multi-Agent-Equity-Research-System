export default function Footer() {
  return (
    <footer className="w-full py-8 border-t border-outline-variant bg-background mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 max-w-[1600px] mx-auto w-full">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          FinPilot Pro
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-left">
          © 2026 FinPilot Pro. Institutional Equity Research.
        </span>
        <div className="flex gap-6">
          <a className="font-body-sm text-body-sm text-outline hover:text-primary transition-colors cursor-pointer" href="#">
            Terms
          </a>
          <a className="font-body-sm text-body-sm text-outline hover:text-primary transition-colors cursor-pointer" href="#">
            Privacy
          </a>
          <a className="font-body-sm text-body-sm text-outline hover:text-primary transition-colors cursor-pointer" href="#">
            Regulatory
          </a>
          <a className="font-body-sm text-body-sm text-outline hover:text-primary transition-colors cursor-pointer" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}