/** Build a synthetic Request for server-side `api` calls. */
export function requestFromHeaders(headers?: HeadersInit): Request {
  return new Request("http://dimah-form.local", { headers });
}
