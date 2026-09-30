const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;

const DEV = 'Dev by Dương Quốc Bảo';
const START_BALANCE = 0;
const MIN_BET = 1000;
const MAX_BET = 50000;

const users = {};
let sessionId = 0;
let history = [];

// ====== 216 ẢNH XÚC XẮC ======
const DICE_IMAGES = {
  '1-1-1': 'https://i.ibb.co/zVT9Qv5F/44495f4566cd.png',
  '1-1-2': 'https://i.ibb.co/14yzZKq/226980a4c944.png',
  '1-1-3': 'https://i.ibb.co/bRMSKFFV/313d80397153.png',
  '1-1-4': 'https://i.ibb.co/cXpVmpM6/7eda3eb65b07.png',
  '1-1-5': 'https://i.ibb.co/Vpjdtjtx/78add0970e51.png',
  '1-1-6': 'https://i.ibb.co/fGvTYnzg/54c19dd2162c.png',
  '1-2-1': 'https://i.ibb.co/RrJ8QB0/5441971a123b.png',
  '1-2-2': 'https://i.ibb.co/0p7ZVW84/10db2870fefb.png',
  '1-2-3': 'https://i.ibb.co/35Cgv69z/5b72165a76a7.png',
  '1-2-4': 'https://i.ibb.co/fGn19vGY/54fd6998eb12.png',
  '1-2-5': 'https://i.ibb.co/0pBLhRhB/e84bffb877ed.png',
  '1-2-6': 'https://i.ibb.co/BH2k8N68/aa110ecf8fcf.png',
  '1-3-1': 'https://i.ibb.co/C5K2HKFZ/d5b93df23054.png',
  '1-3-2': 'https://i.ibb.co/BV8Hnk5g/a0e7dee352b0.png',
  '1-3-3': 'https://i.ibb.co/d0ZFbCfX/dcfb0aae7917.png',
  '1-3-4': 'https://i.ibb.co/FLVtTDcK/164d41124c5b.png',
  '1-3-5': 'https://i.ibb.co/5h70xH3q/96c282c7214d.png',
  '1-3-6': 'https://i.ibb.co/Y7r54NW7/a8cf9e646c7e.png',
  '1-4-1': 'https://i.ibb.co/LXCgFJ46/658680098806.png',
  '1-4-2': 'https://i.ibb.co/bfgd71V/d6d85a43beb4.png',
  '1-4-3': 'https://i.ibb.co/gMVk0MDx/ba29e9a07fe2.png',
  '1-4-4': 'https://i.ibb.co/zhxM2SjL/0e59c50f80f2.png',
  '1-4-5': 'https://i.ibb.co/FLkXRCY3/e8c371112e0d.png',
  '1-4-6': 'https://i.ibb.co/sYH069p/5ac7db9d11f2.png',
  '1-5-1': 'https://i.ibb.co/60CXgmXf/6acac6edf6ff.png',
  '1-5-2': 'https://i.ibb.co/YFT02j8B/589df16db24a.png',
  '1-5-3': 'https://i.ibb.co/xq2PbsYt/b356d55a1942.png',
  '1-5-4': 'https://i.ibb.co/zTqL70sc/84c9cda76811.png',
  '1-5-5': 'https://i.ibb.co/v6RVL1Rm/83a11a628b31.png',
  '1-5-6': 'https://i.ibb.co/Ngkys0Kc/7fc1aed3b7f6.png',
  '1-6-1': 'https://i.ibb.co/K4Pg4PL/36037b80df0d.png',
  '1-6-2': 'https://i.ibb.co/cSJhqrPr/4ecdbcba3815.png',
  '1-6-3': 'https://i.ibb.co/V0gWJJmL/f1e39273955a.png',
  '1-6-4': 'https://i.ibb.co/gpHkkzd/aef3c11f4376.png',
  '1-6-5': 'https://i.ibb.co/BKNkkZM1/74aa66e70ae4.png',
  '1-6-6': 'https://i.ibb.co/gLKh4Gms/d51a9293f5a6.png',
  '2-1-1': 'https://i.ibb.co/TD67yL66/1fab5fadf73d.png',
  '2-1-2': 'https://i.ibb.co/9mtT8nTP/4c070b3173db.png',
  '2-1-3': 'https://i.ibb.co/svrcd3P5/52981573bdf4.png',
  '2-1-4': 'https://i.ibb.co/7dN6sHjc/7e6e6afd7b7d.png',
  '2-1-5': 'https://i.ibb.co/zhZrdgfQ/2c7560dc1967.png',
  '2-1-6': 'https://i.ibb.co/0jFdMngV/3b912d8ca924.png',
  '2-2-1': 'https://i.ibb.co/dwPLNf9C/7d7379893d50.png',
  '2-2-2': 'https://i.ibb.co/rfm2SNbQ/3eec7eb4c83c.png',
  '2-2-3': 'https://i.ibb.co/MysDcjSW/406854ccd616.png',
  '2-2-4': 'https://i.ibb.co/LD7TKMYB/c3f1ba1c3abb.png',
  '2-2-5': 'https://i.ibb.co/V0zvJYTQ/899a153036d7.png',
  '2-2-6': 'https://i.ibb.co/FLnJf6gv/e89b358c42ec.png',
  '2-3-1': 'https://i.ibb.co/rV47XW9/9ccd1a34d3e1.png',
  '2-3-2': 'https://i.ibb.co/8LZ42SPy/b25a71902889.png',
  '2-3-3': 'https://i.ibb.co/vCssXXmh/8e11541cb9aa.png',
  '2-3-4': 'https://i.ibb.co/gQZRfNn/9aa37311161e.png',
  '2-3-5': 'https://i.ibb.co/PGKQ8SbT/1c9abe3e8716.png',
  '2-3-6': 'https://i.ibb.co/rGybqgRp/a93318f5d966.png',
  '2-4-1': 'https://i.ibb.co/7Ng9mQzh/76134c19b524.png',
  '2-4-2': 'https://i.ibb.co/23tKSCJM/08ab7ef0185c.png',
  '2-4-3': 'https://i.ibb.co/v4tycMth/827b430454b7.png',
  '2-4-4': 'https://i.ibb.co/V0ffTpNY/d7d4ac9c5cda.png',
  '2-4-5': 'https://i.ibb.co/TMQygP1h/a4e0465d4b17.png',
  '2-4-6': 'https://i.ibb.co/jP9GjzM0/29b407122105.png',
  '2-5-1': 'https://i.ibb.co/b5zsx45v/a1f363046fa6.png',
  '2-5-2': 'https://i.ibb.co/8VsPnfh/b6836ddcd420.png',
  '2-5-3': 'https://i.ibb.co/Xx7R9f9w/2ec979b7a2a2.png',
  '2-5-4': 'https://i.ibb.co/fGqktWy0/c1688d2b639a.png',
  '2-5-5': 'https://i.ibb.co/HLzfNf4d/85fab8b0b571.png',
  '2-5-6': 'https://i.ibb.co/BHYnQVV7/9e892ceba257.png',
  '2-6-1': 'https://i.ibb.co/h1rcs45K/5e64db6554b1.png',
  '2-6-2': 'https://i.ibb.co/cKQD44RG/bbb33a9e4cbb.png',
  '2-6-3': 'https://i.ibb.co/z9Cw145/b919141075ef.png',
  '2-6-4': 'https://i.ibb.co/cSjrm2tp/545ae9c3210f.png',
  '2-6-5': 'https://i.ibb.co/JRbYBg3Y/f699bba81371.png',
  '2-6-6': 'https://i.ibb.co/JjsHRbk0/183c4215207d.png',
  '3-1-1': 'https://i.ibb.co/FqhsKntf/d092af3fe5f1.png',
  '3-1-2': 'https://i.ibb.co/JRWyGzqd/34eae92acdfc.png',
  '3-1-3': 'https://i.ibb.co/k6MBB1q8/a6f065e8f0f1.png',
  '3-1-4': 'https://i.ibb.co/SX45mnj0/35786869c737.png',
  '3-1-5': 'https://i.ibb.co/rGK48Pbm/d12d9098fe4a.png',
  '3-1-6': 'https://i.ibb.co/mFG1F8h4/33f8d1cf224e.png',
  '3-2-1': 'https://i.ibb.co/rGp8C3qW/ca7a743bb9f7.png',
  '3-2-2': 'https://i.ibb.co/WW3SS88W/2a1c865f7aee.png',
  '3-2-3': 'https://i.ibb.co/Nn9MpdXZ/cb2befb6855d.png',
  '3-2-4': 'https://i.ibb.co/gZFqBLGJ/178d559143a9.png',
  '3-2-5': 'https://i.ibb.co/GvZLCLCL/4d5336e58ead.png',
  '3-2-6': 'https://i.ibb.co/9mBHHnxz/9addb1f1b874.png',
  '3-3-1': 'https://i.ibb.co/JWZPPX3w/76a15fd113f1.png',
  '3-3-2': 'https://i.ibb.co/dwH0KKGX/cafdf4ae1721.png',
  '3-3-3': 'https://i.ibb.co/gb42LK91/8b5f428eb4f4.png',
  '3-3-4': 'https://i.ibb.co/1thF1fmV/a4a89bc7e332.png',
  '3-3-5': 'https://i.ibb.co/sJsYcwfj/67fc7e4ab74c.png',
  '3-3-6': 'https://i.ibb.co/8LmNvXKw/568f39ddb462.png',
  '3-4-1': 'https://i.ibb.co/prWZtLg7/502ce2aff8ce.png',
  '3-4-2': 'https://i.ibb.co/9mknVNWw/1a672bb82439.png',
  '3-4-3': 'https://i.ibb.co/dwB3FhcT/f96c20b7263c.png',
  '3-4-4': 'https://i.ibb.co/nM4bvbhr/74abd84eba97.png',
  '3-4-5': 'https://i.ibb.co/Gv5hBsqX/72bb230aeb83.png',
  '3-4-6': 'https://i.ibb.co/rGC98WXq/732b8b42606b.png',
  '3-5-1': 'https://i.ibb.co/jPdRgvZk/30c1e0375393.png',
  '3-5-2': 'https://i.ibb.co/3mczsJGZ/6d01f6f422bb.png',
  '3-5-3': 'https://i.ibb.co/Y71F5ddv/4f0478c35fdf.png',
  '3-5-4': 'https://i.ibb.co/N2kf7VZD/dbf66e34f479.png',
  '3-5-5': 'https://i.ibb.co/b5D0N5Gf/ab9b1d744146.png',
  '3-5-6': 'https://i.ibb.co/8gBKLWsQ/6e762aeb16f9.png',
  '3-6-1': 'https://i.ibb.co/C5pMhdkb/07615ec0e2c7.png',
  '3-6-2': 'https://i.ibb.co/YFwCNQYq/67fd61d4c6c8.png',
  '3-6-3': 'https://i.ibb.co/mnNHp8g/b9042e0af04f.png',
  '3-6-4': 'https://i.ibb.co/0Vzp7Dh2/5ec737947651.png',
  '3-6-5': 'https://i.ibb.co/YTBQJz6m/989fb9f99fda.png',
  '3-6-6': 'https://i.ibb.co/46tnDVT/8687728bbf4f.png',
  '4-1-1': 'https://i.ibb.co/xKVPBvFV/32c8ab0e9b58.png',
  '4-1-2': 'https://i.ibb.co/mVbyzyFn/f6229ed36c38.png',
  '4-1-3': 'https://i.ibb.co/DN3nyvQ/74e74016d085.png',
  '4-1-4': 'https://i.ibb.co/5hfQKfk3/61718c0b0783.png',
  '4-1-5': 'https://i.ibb.co/rGyJGvV7/2c720a97de5f.png',
  '4-1-6': 'https://i.ibb.co/Vpqvbb1m/a38b54040641.png',
  '4-2-1': 'https://i.ibb.co/D3myZ4z/c5639e251691.png',
  '4-2-2': 'https://i.ibb.co/d0pRfZ7N/493860aa008f.png',
  '4-2-3': 'https://i.ibb.co/cS63RTWR/2212bfda93b5.png',
  '4-2-4': 'https://i.ibb.co/hRVTX8CQ/f393955f419b.png',
  '4-2-5': 'https://i.ibb.co/DHrCHt63/f14a8e68e6da.png',
  '4-2-6': 'https://i.ibb.co/9mxHw1NR/b147849aff77.png',
  '4-3-1': 'https://i.ibb.co/h1xzNs0H/399c6cb9c818.png',
  '4-3-2': 'https://i.ibb.co/KchR1g3j/608b120a0700.png',
  '4-3-3': 'https://i.ibb.co/yBWLKBYQ/6db3721c0fcd.png',
  '4-3-4': 'https://i.ibb.co/99SSwyrV/91558d16b787.png',
  '4-3-5': 'https://i.ibb.co/KpL9TqZV/739c2575355e.png',
  '4-3-6': 'https://i.ibb.co/KxnpdkfP/b06fc623a365.png',
  '4-4-1': 'https://i.ibb.co/WpgJH4FY/03599f48f465.png',
  '4-4-2': 'https://i.ibb.co/jvhhTYxb/5bd0844f5595.png',
  '4-4-3': 'https://i.ibb.co/qL8KbWyW/776a90b147da.png',
  '4-4-4': 'https://i.ibb.co/whdM1Xf3/cb71ca336263.png',
  '4-4-5': 'https://i.ibb.co/zhBCL598/723fc730393f.png',
  '4-4-6': 'https://i.ibb.co/p6Vnv481/a8315690cbb3.png',
  '4-5-1': 'https://i.ibb.co/JwtCmTpp/bbb9bfce21d2.png',
  '4-5-2': 'https://i.ibb.co/chKxtKQF/bce1202f4833.png',
  '4-5-3': 'https://i.ibb.co/xqdfBwnT/732f25ed6e61.png',
  '4-5-4': 'https://i.ibb.co/cK4DyNVw/d5f9ca74f870.png',
  '4-5-5': 'https://i.ibb.co/bM9gjJdy/72789e90242c.png',
  '4-5-6': 'https://i.ibb.co/9zq8shR/59bd84bc79da.png',
  '4-6-1': 'https://i.ibb.co/hxh2V1bL/20ed721b99fa.png',
  '4-6-2': 'https://i.ibb.co/vx5jyws1/3e165dfdf95c.png',
  '4-6-3': 'https://i.ibb.co/JjBjRLv1/78cbc9f93222.png',
  '4-6-4': 'https://i.ibb.co/xS8v8vCh/32732c58ef69.png',
  '4-6-5': 'https://i.ibb.co/wZgB1sBd/94d250240753.png',
  '4-6-6': 'https://i.ibb.co/KxHY95p2/64228bbe0fe0.png',
  '5-1-1': 'https://i.ibb.co/vGhKC48/5d47fe0e4860.png',
  '5-1-2': 'https://i.ibb.co/3YkmPD48/756c7c692cc1.png',
  '5-1-3': 'https://i.ibb.co/Q72z8zgN/c22e7c322136.png',
  '5-1-4': 'https://i.ibb.co/5WNtNtBz/4335bd49be14.png',
  '5-1-5': 'https://i.ibb.co/xk1gsnQ/e302fc3cca40.png',
  '5-1-6': 'https://i.ibb.co/zhQzPFPF/52efde715252.png',
  '5-2-1': 'https://i.ibb.co/Zp5TwKXb/dba38b480466.png',
  '5-2-2': 'https://i.ibb.co/Y4Q9Wc53/f7e8a508d9c1.png',
  '5-2-3': 'https://i.ibb.co/YFDwC6Yt/99d2be8668c4.png',
  '5-2-4': 'https://i.ibb.co/m5Nxvzs3/4dcb2f590634.png',
  '5-2-5': 'https://i.ibb.co/cKBytRYn/87d85e2b5dba.png',
  '5-2-6': 'https://i.ibb.co/0RjJ6hZn/58f3339df66f.png',
  '5-3-1': 'https://i.ibb.co/Y7MZ6tqk/b17debe50146.png',
  '5-3-2': 'https://i.ibb.co/HpCXr08c/5c706c18d9b2.png',
  '5-3-3': 'https://i.ibb.co/3yyjjnkh/fe1b9c09c707.png',
  '5-3-4': 'https://i.ibb.co/dsDPWPgB/3b3ca4478a1c.png',
  '5-3-5': 'https://i.ibb.co/Kxfwfw5s/5242671e4673.png',
  '5-3-6': 'https://i.ibb.co/M5pp1JVt/78008bcce936.png',
  '5-4-1': 'https://i.ibb.co/jPP2FHvm/588844695ce3.png',
  '5-4-2': 'https://i.ibb.co/0p9NM3Wt/bbcee4df17ee.png',
  '5-4-3': 'https://i.ibb.co/0RJ4kbWj/ee2b870177cf.png',
  '5-4-4': 'https://i.ibb.co/Xrsz28c7/c5063eadc73f.png',
  '5-4-5': 'https://i.ibb.co/jkmW2sph/af3fe35c99a3.png',
  '5-4-6': 'https://i.ibb.co/0SDKBbQ/e2002eed90f1.png',
  '5-5-1': 'https://i.ibb.co/XfgcPgc7/0b716574f224.png',
  '5-5-2': 'https://i.ibb.co/tTmkNnqZ/a2ee17f4c2f8.png',
  '5-5-3': 'https://i.ibb.co/HT4LwGpw/dace0a962e8b.png',
  '5-5-4': 'https://i.ibb.co/hJXYbvjp/c242241f8d1e.png',
  '5-5-5': 'https://i.ibb.co/zThcj426/ace267b93023.png',
  '5-5-6': 'https://i.ibb.co/1GJLBC6H/5d1a646f28ad.png',
  '5-6-1': 'https://i.ibb.co/210QCW16/8aafb212fc92.png',
  '5-6-2': 'https://i.ibb.co/kgZNj4MP/7ec3b188b7cb.png',
  '5-6-3': 'https://i.ibb.co/07wjz7C/9d7e4ee1b720.png',
  '5-6-4': 'https://i.ibb.co/kpZZqPF/089861aa7541.png',
  '5-6-5': 'https://i.ibb.co/fGpTJmtd/2c4d32f37593.png',
  '5-6-6': 'https://i.ibb.co/XZQgtLhS/442d3c712f3c.png',
  '6-1-1': 'https://i.ibb.co/tTndM0YW/6a50e6b08922.png',
  '6-1-2': 'https://i.ibb.co/b5d8HrvB/bf83363861a1.png',
  '6-1-3': 'https://i.ibb.co/67HR4hby/930b53ac23ab.png',
  '6-1-4': 'https://i.ibb.co/Ngc3mkqj/7a1f3a0238bd.png',
  '6-1-5': 'https://i.ibb.co/6xYmvVr/ae9b770b2ab1.png',
  '6-1-6': 'https://i.ibb.co/chc7kS86/02735b2045a1.png',
  '6-2-1': 'https://i.ibb.co/S7nNmgn3/8cfe9639779a.png',
  '6-2-2': 'https://i.ibb.co/tMH4mWNH/6d06970b9ab7.png',
  '6-2-3': 'https://i.ibb.co/Z6Sh3kg1/453dd1c76b4c.png',
  '6-2-4': 'https://i.ibb.co/1tqyrfyQ/faa8a4743046.png',
  '6-2-5': 'https://i.ibb.co/ymXGsckX/e28177c1918c.png',
  '6-2-6': 'https://i.ibb.co/j90fZVYH/0c311c777dcc.png',
  '6-3-1': 'https://i.ibb.co/kgBHPR2X/bf2a34e373dd.png',
  '6-3-2': 'https://i.ibb.co/9mm7hdKs/4453d8dbd088.png',
  '6-3-3': 'https://i.ibb.co/xSn2L2Vc/40e5656a8061.png',
  '6-3-4': 'https://i.ibb.co/11cnWWD/bfd90571fcd1.png',
  '6-3-5': 'https://i.ibb.co/TBBXbLFD/2772d650a219.png',
  '6-3-6': 'https://i.ibb.co/N6ZzbHNx/63fd0412aceb.png',
  '6-4-1': 'https://i.ibb.co/MxdLXtq8/ea6a03fd2f07.png',
  '6-4-2': 'https://i.ibb.co/xtv6gp64/f60daa918f21.png',
  '6-4-3': 'https://i.ibb.co/ycWJ2Zb0/00da0bbd59fa.png',
  '6-4-4': 'https://i.ibb.co/HTz503L8/1b51cbe104a1.png',
  '6-4-5': 'https://i.ibb.co/GfZrYZKN/a19a8430bcb9.png',
  '6-4-6': 'https://i.ibb.co/RGqPgDS3/cba7d0e36b1e.png',
  '6-5-1': 'https://i.ibb.co/snsCq6w/775af5d47484.png',
  '6-5-2': 'https://i.ibb.co/4RqNPGBs/491f030c48f1.png',
  '6-5-3': 'https://i.ibb.co/NgXR8HPH/dd9bded29e28.png',
  '6-5-4': 'https://i.ibb.co/W40dKhC0/70d9c430a84b.png',
  '6-5-5': 'https://i.ibb.co/zhFM71NB/3f892e5821bb.png',
  '6-5-6': 'https://i.ibb.co/CsWknw5f/eede50de06df.png',
  '6-6-1': 'https://i.ibb.co/nNnTqJzL/dcacfedd796f.png',
  '6-6-2': 'https://i.ibb.co/PsZc0kF5/8f33c5c472a1.png',
  '6-6-3': 'https://i.ibb.co/My38fLMJ/0c612beb8af5.png',
  '6-6-4': 'https://i.ibb.co/wNB6bWfq/e0492f857a26.png',
  '6-6-5': 'https://i.ibb.co/k2VKsC8g/5acb334e85b4.png',
  '6-6-6': 'https://i.ibb.co/rKbK8mPv/3f10c6801a95.png'
};

// ====== EMOJI XÚC XẮC ======
const DICE_EMOJI = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
// ====== GỬI TIN NHẮN ======
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log('Đã gửi tin tới ' + chatId);
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

// ====== GỬI ẢNH ======
async function sendPhoto(chatId, photoUrl, caption) {
  try {
    await axios.post(`${BASE_URL}/sendPhoto`, {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption || ''
    });
    console.log('Đã gửi ảnh tới ' + chatId);
  } catch (err) {
    console.error('Lỗi gửi ảnh:', err.response ? err.response.data : err.message);
  }
}

// ====== XÚC XẮC ======
function rollDice() {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
}

function playTaiXiu() {
  const dice = rollDice();
  const total = dice[0] + dice[1] + dice[2];
  const result = total >= 11 ? 'Tài' : 'Xỉu';
  return { dice: dice, total: total, result: result };
}

// ====== USER ======
function getUser(userId, name) {
  if (!users[userId]) {
    users[userId] = {
      balance: START_BALANCE,
      name: name || 'Người chơi',
      winCount: 0,
      loseCount: 0,
      totalBet: 0,
      createdAt: Date.now()
    };
    console.log('User mới: ' + name + ' (' + userId + ')');
  }
  return users[userId];
}

function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}

// ====== TEXT LỆNH ======
function getHelpText() {
  return '🎰 BOT TÀI XỈU 🎰\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '💰 LỆNH TIỀN TỆ:\n' +
    '• .tx tài 10000 - Cược Tài\n' +
    '• .tx xỉu 10000 - Cược Xỉu\n' +
    '• .bal - Xem số dư\n' +
    '• .top - Bảng xếp hạng\n' +
    '• .history - Lịch sử phiên\n' +
    '• .me - Thông tin + ID\n' +
    '• .getid - Reply để lấy ID\n' +
    '\n🎮 LỆNH KHÁC:\n' +
    '• .dice - Lắc xúc xắc\n' +
    '• .coin - Tung đồng xu\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getBalText(user) {
  return '💰 SỐ DƯ\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '👤 Tên: ' + user.name + '\n' +
    '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thắng: ' + user.winCount + ' | 💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tổng cược: ' + formatMoney(user.totalBet) + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getMeText(user, userId) {
  return '👤 THÔNG TIN\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📛 Tên: ' + user.name + '\n' +
    '🆔 ID: ' + userId + '\n' +
    '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thắng: ' + user.winCount + '\n' +
    '💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tổng cược: ' + formatMoney(user.totalBet) + '\n' +
    '📅 Tham gia: ' + new Date(user.createdAt).toLocaleString('vi-VN') + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getTopText() {
  const keys = Object.keys(users);
  if (keys.length === 0) {
    return '🏆 BẢNG XẾP HẠNG\n━━━━━━━━━━━━━━━━━━\nChưa có ai chơi!\n━━━━━━━━━━━━━━━━━━\n' + DEV;
  }
  const sorted = keys
    .map(function(k) { return { id: k, user: users[k] }; })
    .sort(function(a, b) { return b.user.balance - a.user.balance; })
    .slice(0, 10);

  let text = '🏆 TOP 10 ĐẠI GIA\n━━━━━━━━━━━━━━━━━━\n';
  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i].user;
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    text += rank + ' ' + u.name + ': ' + formatMoney(u.balance) + '\n';
  }
  text += '━━━━━━━━━━━━━━━━━━\n' + DEV;
  return text;
}

function getHistoryText() {
  if (history.length === 0) {
    return '📜 LỊCH SỬ\n━━━━━━━━━━━━━━━━━━\nChưa có phiên nào!\n━━━━━━━━━━━━━━━━━━\n' + DEV;
  }
  const recent = history.slice(-10).reverse();
  let text = '📜 10 PHIÊN GẦN NHẤT\n━━━━━━━━━━━━━━━━━━\n';
  for (let i = 0; i < recent.length; i++) {
    const h = recent[i];
    const sid = ('00000' + h.id).slice(-5);
    text += '#' + sid + ' | ' + h.dice.join('-') + ' = ' + h.total + ' | ' + h.result + '\n';
  }
  text += '━━━━━━━━━━━━━━━━━━\n' + DEV;
  return text;
}

// ====== XỬ LÝ CƯỢC ======
async function handleBet(chatId, user, choice, amount) {
  const choiceLower = (choice || '').toLowerCase();
  let validChoice = null;

  if (choiceLower === 'tai' || choiceLower === 'tài') validChoice = 'Tài';
  else if (choiceLower === 'xiu' || choiceLower === 'xỉu') validChoice = 'Xỉu';

  if (!validChoice) {
    return sendMessage(chatId, '❌ Sai cú pháp!\n\nDùng: .tx tài 10000\nHoặc: .tx xỉu 10000\n\n' + DEV);
  }

  if (isNaN(amount) || amount <= 0) {
    return sendMessage(chatId, '❌ Số tiền không hợp lệ!\n\nVí dụ: .tx tài 10000\n\n' + DEV);
  }

  amount = Math.floor(amount);

  if (amount < MIN_BET) {
    return sendMessage(chatId, '❌ Cược tối thiểu: ' + formatMoney(MIN_BET) + '\n\n' + DEV);
  }

  if (amount > MAX_BET) {
    return sendMessage(chatId, '❌ Cược tối đa: ' + formatMoney(MAX_BET) + '\n\n' + DEV);
  }

  if (user.balance < amount) {
    return sendMessage(chatId, '❌ Không đủ tiền!\n\n💵 Số dư: ' + formatMoney(user.balance) + '\n💸 Cần: ' + formatMoney(amount) + '\n\n' + DEV);
  }

  user.balance -= amount;
  user.totalBet += amount;

  sessionId++;
  const game = playTaiXiu();
  const diceStr = DICE_EMOJI[game.dice[0] - 1] + ' ' + DICE_EMOJI[game.dice[1] - 1] + ' ' + DICE_EMOJI[game.dice[2] - 1];
  const totalStr = 'Tổng = ' + game.total;

  history.push({
    id: sessionId,
    dice: game.dice,
    total: game.total,
    result: game.result,
    choice: validChoice,
    amount: amount,
    userId: user.name,
    time: Date.now()
  });
  if (history.length > 100) history.shift();

  const sid = ('00000' + sessionId).slice(-5);
  const sessionStr = '#' + sid;
  const isWin = validChoice === game.result;

  const diceKey = game.dice[0] + '-' + game.dice[1] + '-' + game.dice[2];
  const imageUrl = DICE_IMAGES[diceKey];
  
  if (imageUrl) {
    try {
      await sendPhoto(chatId, imageUrl, '🎲 Phiên ' + sessionStr);
    } catch (err) {
      console.error('Lỗi gửi ảnh:', err.message);
    }
  }

  if (isWin) {
    const winAmount = amount * 2;
    user.balance += winAmount;
    user.winCount++;

    return sendMessage(chatId, '🎰 PHIÊN ' + sessionStr + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎲 Xúc xắc: ' + diceStr + '\n' +
      '📊 ' + totalStr + '\n' +
      '🎯 Kết quả: ' + (game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU') + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎉 BẠN THẮNG!\n' +
      '✅ Cược: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💰 Nhận: +' + formatMoney(winAmount) + '\n' +
      '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      DEV);
  } else {
    user.loseCount++;
    return sendMessage(chatId, '🎰 PHIÊN ' + sessionStr + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎲 Xúc xắc: ' + diceStr + '\n' +
      '📊 ' + totalStr + '\n' +
      '🎯 Kết quả: ' + (game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU') + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '😢 BẠN THUA!\n' +
      '❌ Cược: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💸 Mất: -' + formatMoney(amount) + '\n' +
      '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      DEV);
  }
    }
function extractCommand(text) {
  const lower = text.toLowerCase().trim();
  const match = lower.match(/\.([a-z0-9]+)/);
  if (!match) return null;
  return '.' + match[1];
}

async function handleMessage(update) {
  console.log('Nhận update:', JSON.stringify(update, null, 2));

  const message = update.message || update;
  if (!message) return;

  const chatId = message.chat && message.chat.id ? message.chat.id : message.chat_id;
  const chatType = message.chat && message.chat.chat_type ? message.chat.chat_type : 'PRIVATE';
  const senderId = message.from && message.from.id ? message.from.id : (message.from_id || 'unknown');
  const senderName = message.from && message.from.display_name ? message.from.display_name : 'Người chơi';

  const text = (message.text || '').trim();

  if (!chatId || !text) return;

  const user = getUser(senderId, senderName);

  const cmd = extractCommand(text);
  if (!cmd) return;

  if (cmd === '.help' || cmd === '.start') return sendMessage(chatId, getHelpText());
  if (cmd === '.bal' || cmd === '.balance' || cmd === '.money') return sendMessage(chatId, getBalText(user));
  if (cmd === '.me' || cmd === '.info') return sendMessage(chatId, getMeText(user, senderId));
  if (cmd === '.top' || cmd === '.bxh') return sendMessage(chatId, getTopText());
  if (cmd === '.history' || cmd === '.ls') return sendMessage(chatId, getHistoryText());

  if (cmd === '.getid' || cmd === '.id') {
    const replyMsg = message.reply_to_message || message.quote || message.reply || 
                     (message.message && message.message.reply_to_message);
    if (!replyMsg) {
      return sendMessage(chatId, '❌ Cần REPLY tin nhắn của người đó!\n\n' +
        '📌 Cách dùng:\n' +
        '1. NHẤN GIỮ tin nhắn của người đó\n' +
        '2. Chọn "Trả lời"\n' +
        '3. Gõ: .getid\n\n' +
        '💡 Hoặc nhờ họ gõ .me để xem ID\n\n' + DEV);
    }
    const replyFrom = replyMsg.from || {};
    const replyId = replyFrom.id || replyFrom.user_id || 'unknown';
    const replyName = replyFrom.display_name || replyFrom.name || 'Không rõ';
    return sendMessage(chatId, '🆔 THÔNG TIN NGƯỜI ĐƯỢC REPLY\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📛 Tên: ' + replyName + '\n' +
      '🆔 ID: ' + replyId + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' + DEV);
  }

  if (cmd === '.tx') {
    const lowerText = text.toLowerCase();
    const txIndex = lowerText.indexOf('.tx');
    const afterTx = text.substring(txIndex + 3).trim();
    const parts = afterTx.split(/\s+/);
    if (parts.length < 2) {
      return sendMessage(chatId, '❌ Cú pháp: .tx [tài/xỉu] [số tiền]\n\nVí dụ: .tx tài 10000\n\n' + DEV);
    }
    const choice = parts[0];
    const amount = parseInt(parts[1].replace(/[.,]/g, ''), 10);
    return handleBet(chatId, user, choice, amount);
  }

  if (cmd === '.dice') {
    const n = Math.floor(Math.random() * 6) + 1;
    return sendMessage(chatId, '🎲 Bạn lắc được: ' + DICE_EMOJI[n - 1] + ' (' + n + ')\n\n' + DEV);
  }

  if (cmd === '.coin') {
    const result = Math.random() < 0.5 ? 'Sấp' : 'Ngửa';
    return sendMessage(chatId, '🪙 Kết quả: ' + result + '\n\n' + DEV);
  }

  return sendMessage(chatId, '❓ Lệnh không hợp lệ!\n\nGõ .help để xem danh sách lệnh\n\n' + DEV);
}

// ====== WEBHOOK ======
app.post('/webhook', async function(req, res) {
  res.json({ ok: true });
  try {
    await handleMessage(req.body);
  } catch (err) {
    console.error('Lỗi:', err);
  }
});

// ====== HEALTH CHECK ======
app.get('/', function(req, res) {
  res.send('Bot Tài Xỉu OK! | ' + DEV);
});

// ====== KHỞI ĐỘNG ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Bot chạy port ' + PORT);
  console.log(DEV);
});
