import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import guideMd from "@/content/guide.md?raw";
import "../styles/guide.css";

type GuideDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const GuideDrawer: React.FC<GuideDrawerProps> = ({ open, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fonea-guide_overlay" onClick={onClose}>
      <aside className="fonea-guide_panel" onClick={(e) => e.stopPropagation()}>
        <header className="fonea-guide_header">
          <div className="fonea-guide_title">
            <span className="dot" />
            <span>Getting Started</span>
          </div>
          <button className="fonea-guide_close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="fonea-guide_content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {guideMd}
          </ReactMarkdown>
        </div>

        <footer className="fonea-guide_footer">
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </footer>
      </aside>
    </div>,
    document.body
  );
};

export default GuideDrawer;
