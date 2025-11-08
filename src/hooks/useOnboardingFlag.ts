import { useEffect, useState } from 'react';


export function useOnboardingFlag(key = 'fonea.onboarding.seen') {
const [open, setOpen] = useState(false);


useEffect(() => {
const seen = localStorage.getItem(key);
if (!seen) setOpen(true);
}, [key]);


const close = () => {
localStorage.setItem(key, '1');
setOpen(false);
};


const reset = () => localStorage.removeItem(key);


return { open, close, reset };
}