/**
 * Where a user lands once signed in — shared by login(), signup(), and
 * /auth/callback (the signup confirmation link). Always a fixed same-origin
 * path: nothing from the request decides the destination, so there's no
 * open redirect. Change it here if the app's home isn't /dashboard.
 */
export const AFTER_SIGN_IN_PATH = "/dashboard";
