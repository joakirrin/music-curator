// En la consola:
   localStorage.removeItem('cc_cookie');
   localStorage.removeItem('cookie-consent');
   document.cookie = 'cc_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
   location.reload();