// Accounts with access to the private sections and materials (pawn structures, course videos): the owner
// and his partner, who also tests new features. Keep in step with functions/index.js and storage.rules.
export const PRIVATE_ACCESS = [
  'HVCLXy57NDgXPkbrQSVZuAPBunA3', // owner
  'zxX9Ku8PwFhbkUnDlp3F1k9xG9g2', // partner (tester)
];
export const hasPrivateAccess = uid => !!uid && PRIVATE_ACCESS.includes(uid);
