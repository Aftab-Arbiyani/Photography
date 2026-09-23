// k6 load test for the hot read paths (gallery, search, marketplace, discovery).
// Run: BASE_URL=http://localhost:4000/api/v1 k6 run tests/load/browse.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up
    { duration: '1m', target: 50 }, // sustain
    { duration: '20s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<400'], // 95% under 400ms
  },
};

const paths = [
  '/photos?limit=24',
  '/search/photos?q=landscape',
  '/marketplace/albums?limit=24',
  '/discovery/trending/photos',
  '/categories',
];

export default function () {
  const path = paths[Math.floor(Math.random() * paths.length)];
  const res = http.get(`${BASE}${path}`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
