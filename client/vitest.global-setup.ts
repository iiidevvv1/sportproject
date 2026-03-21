// This runs in Node.js context before any tests
// Set NODE_ENV to development so React loads with `act` support
export default function setup() {
  process.env['NODE_ENV'] = 'development';
}

export function teardown() {
  process.env['NODE_ENV'] = 'test';
}
