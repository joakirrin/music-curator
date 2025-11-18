// Clear cookies for 127.0.0.1
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
});

// Clear localStorage + sessionStorage
localStorage.clear();
sessionStorage.clear();

console.log("Cookies, localStorage, and sessionStorage cleared for 127.0.0.1:5173");
