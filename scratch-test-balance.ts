import { fetchApiBalance } from "./src/lib/cekceir";
import { load } from 'cheerio';

async function testBalance() {
  // Test API Balance
  console.log("Checking API Balance...");
  const apiBalance = await fetchApiBalance();
  console.log("API Balance:", apiBalance);

  // Test Web Balance
  console.log("Checking Web Balance...");
  const res = await fetch('https://cekceir.fun/login');
  const html = await res.text();
  const cookiesArray = res.headers.getSetCookie();
  const cookieStr = cookiesArray.join('; ');

  let $ = load(html);
  let csrfToken = $('input[name="_token"]').val() as string;

  const loginUrl = 'https://cekceir.fun/login';
  const params = new URLSearchParams();
  if (csrfToken) params.append('_token', csrfToken);
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

  const dashRes = await fetch('https://cekceir.fun/home', {
    headers: { 'Cookie': authCookie }
  });
  const dashHtml = await dashRes.text();
  $ = load(dashHtml);
  
  const balanceText = $('.info-box-number').first().text().trim(); // Or whatever selector it is
  console.log("Web Balance Raw text from some selector:", balanceText);

  // Try to find Rp anywhere just in case
  const pText = $('body').text().match(/Rp\s*[\d\.,]+/g);
  console.log("Found Rp strings:", pText ? pText.slice(0, 5) : []);
}

testBalance().catch(console.error);
