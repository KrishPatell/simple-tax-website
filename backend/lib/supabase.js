require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase REST API client
 * Uses service role key for full access
 */
async function supabaseRequest(table, options = {}) {
  const {
    method = 'GET',
    body = null,
    query = {},
    select = '*'
  } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('select', select);
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  });

  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}`;

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const fetchOptions = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }

  // For DELETE with no content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Insert a new record
 */
async function insert(table, data) {
  return supabaseRequest(table, {
    method: 'POST',
    body: data
  });
}

/**
 * Select records
 */
async function select(table, options = {}) {
  return supabaseRequest(table, {
    method: 'GET',
    ...options
  });
}

/**
 * Update records
 */
async function update(table, id, data, idColumn = 'id') {
  return supabaseRequest(table, {
    method: 'PATCH',
    body: data,
    query: { [idColumn]: `eq.${id}` }
  });
}

/**
 * Delete records
 */
async function remove(table, id, idColumn = 'id') {
  return supabaseRequest(table, {
    method: 'DELETE',
    query: { [idColumn]: `eq.${id}` }
  });
}

/**
 * Execute raw SQL via Supabase RPC
 * Note: You need to create the function in Supabase first
 */
async function rpc(functionName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  
  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase RPC error: ${response.status} - ${error}`);
  }

  return response.json();
}

module.exports = {
  insert,
  select,
  update,
  remove,
  rpc,
  supabaseRequest
};