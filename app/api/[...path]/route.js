import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let frappeConfig = null;
try {
  const configPath = path.join(process.cwd(), 'frappe_config.json');
  if (fs.existsSync(configPath)) {
    frappeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Loaded Frappe API config in Next.js.');
  }
} catch (err) {
  console.error('Failed to load frappe_config.json in Next.js route:', err);
}

async function handle(req) {
  const { pathname, search } = new URL(req.url);
  
  // Use environment variable, config file site_url, or fallback to localhost
  const siteUrl = process.env.FRAPPE_SITE_URL || frappeConfig?.site_url || 'http://127.0.0.1:8000';
  const cleanSiteUrl = siteUrl.replace(/\/$/, '');
  const targetUrl = `${cleanSiteUrl}${pathname}${search}`;
  
  try {
    const headers = {};
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'expect' && lowerKey !== 'content-length' && lowerKey !== 'cookie') {
        headers[key] = value;
      }
    });

    if (frappeConfig && frappeConfig.api_key && frappeConfig.api_secret) {
      headers['Authorization'] = `token ${frappeConfig.api_key}:${frappeConfig.api_secret}`;
    }

    const options = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        options.body = JSON.stringify(await req.json());
      } else {
        options.body = await req.text();
      }
    }

    console.log(`[Next.js Proxy] forwarding ${req.method} to ${targetUrl}`);
    console.log(`[Next.js Proxy] Headers sent:`, JSON.stringify(headers));
    if (options.body) {
      console.log(`[Next.js Proxy] Body:`, options.body);
    }

    const response = await fetch(targetUrl, options);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'transfer-encoding' && lowerKey !== 'content-encoding') {
        responseHeaders.set(key, value);
      }
    });

    const bodyText = await response.text();
    console.log(`[Next.js Proxy] Response status: ${response.status}`);
    console.log(`[Next.js Proxy] Response body:`, bodyText);

    return new NextResponse(bodyText, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Frappe Next.js Proxy Error:', error);
    return NextResponse.json({ message: 'Error proxying request to Frappe database: ' + error.message }, { status: 500 });
  }
}

export async function GET(req, context) { return handle(req, context); }
export async function POST(req, context) { return handle(req, context); }
export async function PUT(req, context) { return handle(req, context); }
export async function DELETE(req, context) { return handle(req, context); }
