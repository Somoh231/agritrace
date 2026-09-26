/**
 * Supabase invite and recovery links verify the token on Supabase and then
 * redirect to the project's Site URL with the session in the URL fragment
 * (#access_token=…&type=invite) or, for PKCE/OTP templates, in the query
 * (?code=… / ?token_hash=…&type=…). Wherever that lands, this runs first and
 * hands the URL to /auth/callback, which completes sign-in and password setup.
 *
 * A static string (no interpolation). It never reads, logs or stores tokens;
 * it only moves the untouched URL to the callback route.
 */
export const AUTH_REDIRECT_SCRIPT = `(function(){try{var l=window.location;if(l.pathname==="/auth/callback")return;var h=l.hash||"",q=new URLSearchParams(l.search);var fromHash=/(^#|&)(access_token|error_code|error_description)=/.test(h);var fromQuery=q.has("token_hash")&&q.has("type")||(q.has("code")&&(l.pathname==="/"||l.pathname==="/login"));if(fromHash||fromQuery){l.replace("/auth/callback"+l.search+h);}}catch(e){}})();`;
