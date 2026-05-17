import { load } from 'cheerio';
import * as fs from 'fs';

async function test() {
  try {
    const res = await fetch('https://cekceir.fun/login');
    const html = await res.text();
    const cookiesArray = res.headers.getSetCookie();
    let cookieStr = cookiesArray.join('; ');
    
    let $ = load(html);
    let csrfToken = $('input[name="_token"]').val();
    
    const loginUrl = 'https://cekceir.fun/login';
    const params = new URLSearchParams();
    if (csrfToken) params.append('_token', csrfToken as string);
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
    let authCookie = newCookies.join('; ') || cookieStr;
    
    if (loginRes.status === 302 || loginRes.status === 303) {
      // Get topup page
      const dashRes = await fetch('https://cekceir.fun/topup_saldo', {
        headers: { 'Cookie': authCookie }
      });
      const dashHtml = await dashRes.text();
      $ = load(dashHtml);
      csrfToken = $('input[name="_token"]').val();
      
      const topupParams = new URLSearchParams();
      if (csrfToken) topupParams.append('_token', csrfToken as string);
      topupParams.append('payment_method', 'qris');
      topupParams.append('amount', '1000');
      
      const topupRes = await fetch('https://cekceir.fun/topup_saldo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': authCookie
        },
        body: topupParams.toString(),
      });
      
      const topupResultHtml = await topupRes.text();
      fs.writeFileSync('cekceir-topup-result.html', topupResultHtml);
      console.log('Saved to cekceir-topup-result.html');
    }
  } catch (e) {
    console.error(e);
  }
}

test();
