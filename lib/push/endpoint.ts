// Browsers hand out push endpoints on the push services' own hosts. The server POSTs to whatever
// endpoint it stored, so only those hosts are accepted (same rule as the table's check constraint).
const PUSH_HOSTS = /^https:\/\/([a-z0-9-]+\.)*(googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)\//;

export function isPushEndpoint(value: string) {
  return value.length <= 1000 && PUSH_HOSTS.test(value);
}
