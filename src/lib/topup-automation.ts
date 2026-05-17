import { load } from 'cheerio';

export async function requestCekceirTopup(amount: number) {
  try {
    // 1. Get Login Page & CSRF Token
    const res = await fetch('https://cekceir.fun/login');
    const html = await res.text();
    const cookiesArray = res.headers.getSetCookie();
    const cookieStr = cookiesArray.join('; ');

    let $ = load(html);
    let csrfToken = $('input[name="_token"]').val() as string;

    // 2. Perform Login
    const loginUrl = 'https://cekceir.fun/login';
    const params = new URLSearchParams();
    if (csrfToken) params.append('_token', csrfToken);
    
    // Credentials hardcoded for now as requested. Can be moved to env.
    params.append('username', 'mortyon');
    params.append('password', 'Dapuq123@');

    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieStr
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const newCookies = loginRes.headers.getSetCookie();
    const authCookie = newCookies.join('; ') || cookieStr;

    // We expect a redirect on successful login
    if (loginRes.status !== 302 && loginRes.status !== 303) {
      return { success: false, message: 'Login failed, incorrect credentials or layout changed.' };
    }

    // 3. Get Topup Page & CSRF Token
    const dashRes = await fetch('https://cekceir.fun/topup_saldo', {
      headers: { 'Cookie': authCookie }
    });
    const dashHtml = await dashRes.text();
    $ = load(dashHtml);
    csrfToken = $('input[name="_token"]').val() as string;

    if (!csrfToken) {
      return { success: false, message: 'Failed to retrieve CSRF token for top-up form.' };
    }

    // 4. Submit Topup Request
    const topupParams = new URLSearchParams();
    topupParams.append('_token', csrfToken);
    topupParams.append('payment_method', 'qris');
    topupParams.append('amount', amount.toString());

    const topupRes = await fetch('https://cekceir.fun/topup_saldo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': authCookie
      },
      body: topupParams.toString(),
    });

    const topupResultHtml = await topupRes.text();
    
    // 5. Parse Result (QR Code and Details)
    $ = load(topupResultHtml);
    
    // Check for success or error alert
    const errorAlert = $('.alert.error').text().trim();
    if (errorAlert) {
      return { success: false, message: errorAlert };
    }
    
    // Extract QRIS Text from JS
    const qrMatch = topupResultHtml.match(/text:\s*"([^"]+)"/);
    const qrString = qrMatch ? qrMatch[1] : null;

    // Extract Total Bayar
    let totalBayar = '';
    $('table.pay-details tr').each((_, el) => {
      const th = $(el).find('th').text();
      if (th.includes('Total Bayar')) {
        totalBayar = $(el).find('td strong').text().trim();
      }
    });
    
    if (!qrString || !totalBayar) {
        return { success: false, message: 'Failed to parse payment details. Please check manually.' };
    }

    return { 
      success: true, 
      qrString, 
      totalBayar,
      message: `Topup created successfully. Total: ${totalBayar}`
    };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error occurred' };
  }
}
