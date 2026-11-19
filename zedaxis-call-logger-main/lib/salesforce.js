// Minimal Salesforce REST client using the OAuth 2.0 client-credentials flow
// (External Client App with a run-as user). No dependencies: Node's fetch.

const API_VERSION = 'v62.0';

class Salesforce {
  constructor({ loginUrl, clientId, clientSecret, fetchImpl = fetch }) {
    this.loginUrl = loginUrl.replace(/\/$/, '');
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.fetch = fetchImpl;
    this.token = null;
    this.instanceUrl = null;
  }

  async authenticate() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const res = await this.fetch(`${this.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.access_token) {
      throw new Error(`Salesforce auth failed (${res.status}): ${json.error || ''} ${json.error_description || ''}`.trim());
    }
    this.token = json.access_token;
    this.instanceUrl = json.instance_url;
  }

  // One retry after re-authenticating when the session has expired.
  async request(method, path, body) {
    if (!this.token) await this.authenticate();
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await this.fetch(`${this.instanceUrl}/services/data/${API_VERSION}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401 && attempt === 0) {
        await this.authenticate();
        continue;
      }
      const json = res.status === 204 ? null : await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(`Salesforce ${method} ${path.split('?')[0]} failed (${res.status}): ${JSON.stringify(json)}`);
      }
      return json;
    }
  }

  query(soql) {
    return this.request('GET', `/query?q=${encodeURIComponent(soql)}`);
  }

  search(sosl) {
    return this.request('GET', `/search?q=${encodeURIComponent(sosl)}`);
  }

  create(sobject, fields) {
    return this.request('POST', `/sobjects/${sobject}`, fields);
  }

  update(sobject, id, fields) {
    return this.request('PATCH', `/sobjects/${sobject}/${id}`, fields);
  }
}

module.exports = { Salesforce };
