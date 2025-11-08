import React from 'react';
import '../styles/guide.css';


type EmptyStateProps = {
onImport: () => void;
onOpenGuide: () => void;
};


const EmptyState: React.FC<EmptyStateProps> = ({ onImport, onOpenGuide }) => {
return (
<div className="fonea-empty_root">
<div className="fonea-empty_card">
<div className="fonea-empty_badge">Fonea</div>
<h1 className="fonea-empty_title">Curate smarter. Listen deeper.</h1>
<p className="fonea-empty_desc">
Start by importing a playlist JSON from the Companion GPT, or open the guide to see the workflow.
</p>
<div className="fonea-empty_actions">
<button className="btn btn-primary" onClick={onImport}>Import from ChatGPT</button>
<button className="btn btn-ghost" onClick={onOpenGuide}>Open Guide</button>
</div>
<ul className="fonea-empty_steps">
<li><span className="num">1</span> Get JSON from GPT (Round 1)</li>
<li><span className="num">2</span> Import JSON here</li>
<li><span className="num">3</span> Verify, Keep/Skip, add notes</li>
<li><span className="num">4</span> Export Feedback → paste in GPT</li>
<li><span className="num">5</span> Import new round and iterate</li>
</ul>
</div>
</div>
);
};


export default EmptyState;