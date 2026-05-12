import { QRIS_STATIC } from "./redis";

function qrisCrc16(data: string): string {
  let crc = 0xffff;
  for (const c of data) {
    crc ^= c.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function qrisSetAmount(amount: number): string {
  const staticQris = QRIS_STATIC;
  if (!staticQris) return "";

  const tlv: Record<string, string> = {};
  const tagOrder: string[] = [];
  let pos = 0;
  while (pos < staticQris.length) {
    const tag = staticQris.substring(pos, pos + 2);
    const length = parseInt(staticQris.substring(pos + 2, pos + 4));
    const value = staticQris.substring(pos + 4, pos + 4 + length);
    tlv[tag] = value;
    if (!tagOrder.includes(tag)) tagOrder.push(tag);
    pos += 4 + length;
  }

  tlv["01"] = "12";
  tlv["54"] = String(amount);
  if (!tagOrder.includes("54")) {
    const idx = tagOrder.indexOf("53");
    tagOrder.splice(idx >= 0 ? idx + 1 : tagOrder.length - 1, 0, "54");
  }

  let result = "";
  for (const tag of tagOrder) {
    if (tag === "63") continue;
    const val = tlv[tag];
    result += `${tag}${String(val.length).padStart(2, "0")}${val}`;
  }
  result += "6304";
  result += qrisCrc16(result);
  return result;
}
