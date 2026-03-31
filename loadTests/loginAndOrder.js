import { sleep, group, check, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '1m' },
        { target: 20, duration: '3m30s' },
        { target: 0, duration: '1m' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response

  const vars = {}

  group('page_1 - http://127.0.0.1:5173/', function () {
    // Login user
    response = http.put(
      'http://jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com/api/auth',
      '{"email":"testuser1@gmail.com","password":"test123"}',
      {
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'application/json',
          Host: 'jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com',
          Origin: 'http://127.0.0.1:5173',
        },
      }
    )

    if (!check(response, { 'login status is 200': (r) => r.status === 200 })) {
      console.log(response.body)
      fail('Login was not successful')
    }

    vars['token'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(5.3)

    // Get menu
    response = http.get(
      'http://jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com/api/order/menu',
      {
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          Authorization: `Bearer ${vars['token']}`,
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'application/json',
          Host: 'jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com',
          Origin: 'http://127.0.0.1:5173',
        },
      }
    )

    sleep(1.2)

    // Get franchise data
    response = http.get(
      'http://jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com/api/franchise?page=0&limit=20&name=*',
      {
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          Authorization: `Bearer ${vars['token']}`,
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'application/json',
          Host: 'jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com',
          Origin: 'http://127.0.0.1:5173',
        },
      }
    )

    sleep(9.5)

    // Get current user
    response = http.get('http://jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com/api/user/me', {
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        Authorization: `Bearer ${vars['token']}`,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'application/json',
        Host: 'jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com',
        Origin: 'http://127.0.0.1:5173',
      },
    })

    sleep(4.1)

    // Create order
    response = http.post(
      'http://jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com/api/order',
      '{"items":[{"menuId":1,"description":"Pepperoni","price":0.05},{"menuId":1,"description":"Pepperoni","price":0.05}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          Authorization: `Bearer ${vars['token']}`,
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'application/json',
          Host: 'jwt-pizza-alb-684965799.us-east-1.elb.amazonaws.com',
          Origin: 'http://127.0.0.1:5173',
        },
      }
    )

    if (!check(response, { 'purchase status is 200': (r) => r.status === 200 })) {
      console.log(response.body)
      fail('Purchase was not successful')
    }

    vars['pizzaJwt'] = jsonpath.query(response.json(), '$.jwt')[0]

    sleep(10.2)

    // Verify pizza
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      JSON.stringify({ jwt: vars['pizzaJwt'] }),
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,es;q=0.8',
          authorization: `Bearer ${vars['token']}`,
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          origin: 'http://127.0.0.1:5173',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-storage-access': 'active',
        },
      }
    )
  })
}