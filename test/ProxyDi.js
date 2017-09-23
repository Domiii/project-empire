const p1 = new Proxy({ x: 1 }, {
  get: (target, name) => {
    console.log(`read "${name}" of: p1`);
    return target[name];
  }
});

const p2 = new Proxy({ p1 }, {
  get: (target, name) => {
    console.log(`read "${name}" of p2`);
    return target[name];
  }
});


function f({ p1: { x } }) {
  console.warn(x);
}

f(p2);