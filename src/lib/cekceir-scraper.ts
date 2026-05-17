import { load } from 'cheerio';

async function loginAndGetCookie(): Promise<string> {
  const res = await fetch('https://cekceir.fun/login');
  const html = await res.text();
  const cookiesArray = res.headers.getSetCookie();
  const cookieStr = cookiesArray.join('; ');

  const $ = load(html);
  const csrfToken = $('input[name="_token"]').val() as string;

  const params = new URLSearchParams();
  if (csrfToken) params.append('_token', csrfToken);
  params.append('username', 'mortyon');
  params.append('password', 'Dapuq123@');

  const loginRes = await fetch('https://cekceir.fun/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
    body: params.toString(),
    redirect: 'manual',
  });

  const newCookies = loginRes.headers.getSetCookie();
  const authCookie = newCookies.join('; ') || cookieStr;

  if (loginRes.status !== 302 && loginRes.status !== 303) {
    throw new Error('Login gagal, cek kredensial.');
  }

  return authCookie;
}

export interface CeirOrder {
  id: string;
  service: string;
  imei: string;
  via: string;
  price: string;
  status: string;
  time: string;
  detailUrl: string | null;
}

export interface RoamerOrder {
  id: string;
  service: string;
  imei: string;
  via: string;
  price: string;
  status: string;
  orderTime: string;
  processTime: string;
  completionTime: string;
  detailUrl: string | null;
}

export interface OrderDetail {
  fields: Record<string, string>;
  logs: string;
}

export async function fetchUserOrders(search?: string): Promise<{ success: boolean; orders?: CeirOrder[]; message?: string }> {
  try {
    const cookie = await loginAndGetCookie();
    const url = search 
      ? `https://cekceir.fun/user_orders?search=${encodeURIComponent(search)}`
      : 'https://cekceir.fun/user_orders';
    
    const res = await fetch(url, { headers: { 'Cookie': cookie } });
    const html = await res.text();
    const $ = load(html);

    const orders: CeirOrder[] = [];
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 7) return;

      const id = $(cells[0]).text().trim();
      const service = $(cells[1]).text().trim();
      const imei = $(cells[2]).text().trim();
      const via = $(cells[3]).text().trim();
      const price = $(cells[4]).text().trim();
      const status = $(cells[5]).text().trim();
      const time = $(cells[6]).text().trim();
      
      // Detail button - look for onclick or data attribute with order ID
      let detailUrl: string | null = null;
      const btn = $(cells[7]).find('button, a');
      const onclick = btn.attr('onclick') || '';
      const dataId = btn.attr('data-id') || btn.attr('data-order-id') || '';
      if (dataId) detailUrl = dataId;
      else {
        const match = onclick.match(/(\d+)/);
        if (match) detailUrl = match[1];
      }

      orders.push({ id, service, imei, via, price, status, time, detailUrl });
    });

    return { success: true, orders };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchRoamerOrders(search?: string): Promise<{ success: boolean; orders?: RoamerOrder[]; message?: string }> {
  try {
    const cookie = await loginAndGetCookie();
    const url = search
      ? `https://cekceir.fun/roamer_orders?search=${encodeURIComponent(search)}`
      : 'https://cekceir.fun/roamer_orders';
    
    const res = await fetch(url, { headers: { 'Cookie': cookie } });
    const html = await res.text();
    const $ = load(html);

    const orders: RoamerOrder[] = [];
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 8) return;

      const id = $(cells[0]).text().trim();
      const service = $(cells[1]).text().trim();
      const imei = $(cells[2]).text().trim();
      const via = $(cells[3]).text().trim();
      const price = $(cells[4]).text().trim();
      const status = $(cells[5]).text().trim();
      const orderTime = $(cells[6]).text().trim();
      const processTime = $(cells[7]).text().trim();
      const completionTime = cells.length > 8 ? $(cells[8]).text().trim() : '';

      let detailUrl: string | null = null;
      const lastCell = cells.length > 9 ? cells[9] : cells[8];
      const btn = $(lastCell).find('button, a');
      const onclick = btn.attr('onclick') || '';
      const dataId = btn.attr('data-id') || btn.attr('data-order-id') || '';
      if (dataId) detailUrl = dataId;
      else {
        const match = onclick.match(/(\d+)/);
        if (match) detailUrl = match[1];
      }

      orders.push({ id, service, imei, via, price, status, orderTime, processTime, completionTime, detailUrl });
    });

    return { success: true, orders };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchOrderDetail(orderId: string, type: 'user' | 'roamer'): Promise<{ success: boolean; detail?: OrderDetail; message?: string }> {
  try {
    const cookie = await loginAndGetCookie();
    // Detail data is embedded in <template> elements on the list page itself
    const url = type === 'user' ? 'https://cekceir.fun/user_orders' : 'https://cekceir.fun/roamer_orders';
    
    const res = await fetch(url, { headers: { 'Cookie': cookie } });
    const html = await res.text();
    const $ = load(html);

    // Find the template element containing the detail
    // User orders: <template id="orderDetailTpl{id}">
    // Roamer orders: <template id="tpl-{id}">
    const cleanId = orderId.replace('#', '');
    const tplSelector = type === 'user'
      ? `template#orderDetailTpl${cleanId}`
      : `template#tpl-${cleanId}`;
    
    let tplHtml = $(tplSelector).html();

    // Fallback: try other possible selectors
    if (!tplHtml) {
      tplHtml = $(`template[id*="${cleanId}"]`).html();
    }

    if (!tplHtml) {
      return { success: false, message: `Detail template untuk order #${cleanId} tidak ditemukan di halaman.` };
    }

    // Parse the template content
    const tpl$ = load(tplHtml);
    const fields: Record<string, string> = {};
    let logs = '';

    // === Roamer format: .detail-grid > .detail-item with .dl (label) and .dv (value) ===
    tpl$('.detail-item').each((_, el) => {
      const label = tpl$(el).find('.dl').text().trim().replace(/[:\s]+$/, '');
      const value = tpl$(el).find('.dv').text().trim();
      if (label && value) fields[label] = value;
    });

    // === CEIR format: .raw-block with <pre> for result, .note-box for notes ===
    const preEl = tpl$('pre');
    if (preEl.length) {
      logs = preEl.text().trim();
      fields['Hasil'] = logs;
    }

    const noteBox = tpl$('.note-box');
    if (noteBox.length) {
      const noteText = noteBox.text().trim().replace(/^Catatan:\s*/i, '');
      fields['Catatan'] = noteText;
    }

    // === Fallback: table rows (th: label, td: value) ===
    if (Object.keys(fields).length === 0) {
      tpl$('table tr, tr').each((_, row) => {
        const thEl = tpl$(row).find('th');
        const tdEl = tpl$(row).find('td');
        if (thEl.length && tdEl.length) {
          const key = thEl.text().trim().replace(/[:\s]+$/, '');
          const val = tdEl.text().trim();
          if (key && val) fields[key] = val;
        }
      });
    }

    // If still no structured data, dump raw text
    if (Object.keys(fields).length === 0) {
      fields['raw'] = tplHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 5000);
    }

    return { success: true, detail: { fields, logs } };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

